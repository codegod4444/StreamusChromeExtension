﻿define([
    'background/collection/streamItems',
    'background/model/relatedSongsManager',
    'common/enum/playerState',
    'common/enum/repeatButtonState'
], function(StreamItems, RelatedSongsManager, PlayerState, RepeatButtonState) {
    'use strict';

    var Stream = Backbone.Model.extend({
        localStorage: new Backbone.LocalStorage('Stream'),

        defaults: function () {
            return {
                //  Need to set the ID for Backbone.LocalStorage
                id: 'Stream',
                items: new StreamItems(),
                relatedSongsManager: new RelatedSongsManager(),
                history: [],
                player: null,
                shuffleButton: null,
                radioButton: null,
                repeatButton: null
            };
        },
        
        //  Don't want to save everything to localStorage -- only variables which need to be persisted.
        whitelist: ['history'],
        toJSON: function () {
            return this.pick(this.whitelist);
        },
        
        initialize: function () {
            this.listenTo(this.get('player'), 'change:state', this._onPlayerChangeState);
            this.listenTo(this.get('player'), 'youTubeError', this._onPlayerYouTubeError);
            this.listenTo(this.get('items'), 'add', this._onItemsAdd);
            this.listenTo(this.get('items'), 'remove', this._onItemsRemove);
            this.listenTo(this.get('items'), 'reset', this._onItemsReset);
            this.listenTo(this.get('items'), 'change:active', this._onItemsChangeActive);

            this.fetch();

            var activeItem = this.get('items').getActiveItem();
            if (!_.isUndefined(activeItem)) {
                this.get('player').activateSong(activeItem.get('song'));
            }
        },

        //  TODO: Function is way too big.
        //  If a streamItem which was active is removed, activateNext will have a removedActiveItemIndex provided
        activateNext: function (removedActiveItemIndex) {
            var nextItem = null;

            var shuffleEnabled = this.get('shuffleButton').get('enabled');
            var radioEnabled = this.get('radioButton').get('enabled');
            var repeatButtonState = this.get('repeatButton').get('state');
            var items = this.get('items');
            var currentActiveItem = items.getActiveItem();
            
            //  If removedActiveItemIndex is provided, RepeatButtonState.RepeatSong doesn't matter because the StreamItem was just deleted.
            if (_.isUndefined(removedActiveItemIndex) && repeatButtonState === RepeatButtonState.RepeatSong) {
                nextItem = currentActiveItem;
                nextItem.trigger('change:active', nextItem, true);
            } else if (shuffleEnabled) {
                var eligibleItems = items.notPlayedRecently();

                //  TODO: It doesn't make sense that the Stream cycles indefinitely through shuffled songs without RepeatStream enabled.
                //  All songs will be played recently if there's only one item because it just finished playing.
                if (eligibleItems.length > 0) {
                    nextItem = _.shuffle(eligibleItems)[0];
                    nextItem.save({ active: true });
                }
            } else {
                var nextItemIndex;

                if (!_.isUndefined(removedActiveItemIndex)) {
                    nextItemIndex = removedActiveItemIndex;
                } else {
                    nextItemIndex = items.indexOf(items.getActiveItem()) + 1;

                    if (nextItemIndex <= 0) {
                        throw new Error('Failed to find nextItemIndex. More info: ' + JSON.stringify(items));
                    }
                }

                //  Activate the next item by index. Potentially go back one if deleting last item.
                if (nextItemIndex === items.length) {
                    if (repeatButtonState === RepeatButtonState.RepeatStream) {
                        nextItem = items.first();

                        //  Looped back to the front but that item was already active (only 1 in playlist during a skip), resend activated trigger.
                        if (nextItem.get('active')) {
                            nextItem.trigger('change:active', nextItem, true);
                        } else {
                            nextItem.save({ active: true });
                        }
                    }
                    else if (radioEnabled) {
                        var randomRelatedSong = items.getRandomRelatedSong();

                        var addedSongs = items.addSongs(randomRelatedSong, {
                            //  Mark as active after adding it to deselect other active items and ensure it is visible visually.
                            markFirstActive: true
                        });

                        nextItem = addedSongs[0];
                    }
                    //  If the active item was deleted and there's nothing to advance forward to -- activate the previous item and pause.
                    //  This should go AFTER radioEnabled check because it feels good to skip to the next one when deleting last with radio turned on.
                    else if (!_.isUndefined(removedActiveItemIndex)) {
                        items.last().save({ active: true });
                        this.get('player').pause();
                    }
                    else {
                        //  Otherwise, activate the first item in the playlist and then pause the player because playlist looping shouldn't continue.
                        items.first().save({ active: true });
                        this.get('player').pause();
                    }
                } else {
                    nextItem = items.at(nextItemIndex);
                    nextItem.save({ active: true });
                }
            }
            
            //  Push the last active item into history when going forward:
            if (nextItem !== null && !_.isUndefined(currentActiveItem)) {
                //  If the last item (sequentially) is removed and it was active, the previous item is activated.
                //  This can cause a duplicate to be added to history if you just came from that item.
                var history = this.get('history');
                
                if (history[0] !== currentActiveItem.get('id')) {
                    history.unshift(currentActiveItem.get('id'));
                    this.save('history', history);
                }
            }

            return nextItem;
        },
        
        activatePrevious: function () {
            var previousStreamItem = this.getPrevious();

            //  When repeating a song -- it'll already be active, but still need to trigger a change:active event so program will respond.
            if (previousStreamItem.get('active')) {
                previousStreamItem.trigger('change:active', previousStreamItem, true);
            } else {
                //  Remove the entry from history when activating the previous item.
                var history = this.get('history');
                history.shift();
                this.save('history', history);

                previousStreamItem.save({ active: true });
            }
        },

        //  Return the previous item or null without affecting the history.
        getPrevious: function () {
            var previousStreamItem = null;
            var history = this.get('history');

            if (history.length > 0) {
                previousStreamItem = this.get(history[0]);
            }

            //  If nothing found by history -- rely on settings
            if (previousStreamItem == null) {
                var shuffleEnabled = this.get('shuffleButton').get('enabled');
                var repeatButtonState = this.get('repeatButton').get('state');
                var items = this.get('items');

                if (repeatButtonState === RepeatButtonState.RepeatSong) {
                    //  If repeating a single song just return whichever song is already currently active.
                    previousStreamItem = items.getActiveItem() || null;
                } else if (shuffleEnabled) {
                    //  If shuffle is enabled and there's nothing in history -- grab a random song which hasn't been played recently.
                    previousStreamItem = _.shuffle(items.notPlayedRecently())[0] || null;
                } else {
                    //  Activate the previous item by index. Potentially loop around to the back.
                    var activeItemIndex = items.indexOf(items.getActiveItem());

                    if (activeItemIndex === 0) {
                        if (repeatButtonState === RepeatButtonState.RepeatStream) {
                            previousStreamItem = items.last() || null;
                        }
                    } else {
                        previousStreamItem = items.at(activeItemIndex - 1) || null;
                    }
                }
            }

            return previousStreamItem;
        },
        
        clear: function () {
            //  Reset and clear instead of going through this.set() as a performance optimization
            var items = this.get('items');
            items.reset();
            items.localStorage._clear();
        },
        
        //  A StreamItem's related song information is used when radio mode is enabled to allow users to discover new music.
        _onItemsAdd: function (model) {
            if (model.get('relatedSongs').length === 0) {
                this.get('relatedSongsManager').getRelatedSongs({
                    songId: model.get('song').get('id'),
                    success: this._onGetRelatedSongsSuccess.bind(this, model)
                });
            }
        },
        
        _onGetRelatedSongsSuccess: function(model, relatedSongs) {
            model.get('relatedSongs').reset(relatedSongs.models);
            model.save();
        },
        
        _onItemsRemove: function (model, collection, options) {
            var history = this.get('history');
            history = _.without(history, model.get('id'));
            this.save('history', history);
            
            if (model.get('active') && collection.length > 0) {
                this.activateNext(options.index);
            }
            
            this._stopPlayerIfEmpty();
        },
        
        _onItemsReset: function () {
            this.save('history', []);
            this._stopPlayerIfEmpty();
        },
        
        _onItemsChangeActive: function (model, active) {
            if (active) {
                this._loadActiveItem(model);
            }
        },

        _onPlayerChangeState: function (model, state) {
            if (state === PlayerState.Ended) {
                //  TODO: I need to be able to check whether there's an active item or not before calling activateNext.
                model.set('playOnActivate', true);
                var nextItem = this.activateNext();

                if (nextItem === null) {
                    model.set('playOnActivate', false);
                }
            }
            else if (state === PlayerState.Playing) {
                //  Only display notifications if the foreground isn't active -- either through the extension popup or as a URL tab
                this.get('items').showActiveNotification();
            }
        },

        _onPlayerYouTubeError: function (model, youTubeError) {
            if (this.get('items').length > 0) {
                model.set('playOnActivate', true);
                //  TODO: It would be better if I could get the next item instead of having to activate it automatically.
                var nextItem = this.activateNext();

                if (nextItem === null) {
                    model.set('playOnActivate', false);

                    //  TODO: Once I refactoring activateNext and have better ways of handling errors then I can re-enable this, but infinite looping for now sucks.
                    //  YouTube's API does not emit an error if the cue'd video has already emitted an error.
                    //  So, when put into an error state, re-cue the video so that subsequent user interactions will continue to show the error.
                    //model.activateSong(this.get('items').getActiveItem().get('song'));
                }
            } else {
                //  TODO: I don't understand how _onPlayerError could ever fire when length is 0, but it happens in production.
                var error = new Error('Error ' + youTubeError + ' happened while StreamItems was empty.');
                Streamus.channels.error.commands.trigger('log:error', error);
            }
        },
        
        _stopPlayerIfEmpty: function () {
            if (this.get('items').length === 0) {
                this.get('player').stop();
            }
        },
        
        _loadActiveItem: function (activeItem) {
            this.get('player').activateSong(activeItem.get('song'));
        }
    });

    return Stream;
})