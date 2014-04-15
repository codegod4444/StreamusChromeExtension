﻿define([
    'foreground/view/multiSelectCompositeView',
    'foreground/view/leftBasePane/playlistItemView',
    'text!template/activePlaylistArea.html'
], function (MultiSelectCompositeView, PlaylistItemView, ActivePlaylistAreaTemplate) {
    'use strict';

    var StreamItems = chrome.extension.getBackgroundPage().StreamItems;

    var ActivePlaylistAreaView = MultiSelectCompositeView.extend({

        template: _.template(ActivePlaylistAreaTemplate),
        
        templateHelpers: function () {
            return {
                showSearchMessage: chrome.i18n.getMessage('showSearch'),
                searchForSongsMessage: chrome.i18n.getMessage('searchForSongs'),
                playlistEmptyMessage: chrome.i18n.getMessage('playlistEmpty'),
                wouldYouLikeToMessage: chrome.i18n.getMessage('wouldYouLikeTo'),
                addAllMessage: chrome.i18n.getMessage('addAll'),
                playAllMessage: chrome.i18n.getMessage('playAll')
            };
        },

        itemView: PlaylistItemView,
        itemViewContainer: '#active-playlist-items',

        ui: {
            list: '.list',
            playlistDetails: '.playlist-details',
            playlistEmptyMessage: '.playlist-empty',
            bottomMenubar: '.left-bottom-menubar',
            itemContainer: '#active-playlist-items',
            bigTextWrapper: '.big-text-wrapper',
            playAll: '.play-all',
            addAll: '.add-all'
        },
        
        events: _.extend({}, MultiSelectCompositeView.prototype.events, {
            'click @ui.addAll': 'addAllToStream',
            'click @ui.playAll': 'playAllInStream'
        }),
        
        modelEvents: {
            'change:displayInfo': 'updatePlaylistDetails'
        },
        
        collectionEvents: {
            'add remove reset': function () {
                this.toggleBigText();
                this.toggleBottomMenubar();

                //  Trigger a scroll event to inform lazyloader of possible changes.
                this.ui.itemContainer.trigger('scroll');
            }
        },

        onShow: function () {
            this.onFullyVisible();
            
            this.ui.playlistDetails.qtip();
            this.ui.addAll.qtip();
            this.ui.playAll.qtip();
            
            this.children.each(function (child) {
                child.setTitleTooltip(child.ui.title);
            });

            var self = this;
            var lastScrollTop = 0;
            
            //  Throttle the scroll event because scrolls can happen a lot and don't need to re-calculate very often.
            this.ui.list.scroll(_.throttle(function () {
                var scrollTop = this.scrollTop;
                var currentMaxRenderedIndex = self.maxRenderedIndex;

                var direction = scrollTop > lastScrollTop ? 'down' : 'up';
                
                //  When the user scrolls down, append new items to the end of the list and remove from the start.
                if (direction === 'down') {

                    //  Start appending when half way through the currently rendered amount.
                    var exceededInitialLoad = self.initialLoad && scrollTop >= self.initialLoadScrollAllowance;
                    var secondaryScroll = (currentMaxRenderedIndex * 40) - self.initialLoadScrollAllowance;
                    var exceededSecondaryLoad = !self.initialLoad && scrollTop > secondaryScroll;

                    if (exceededInitialLoad || exceededSecondaryLoad) {
                        self.initialLoad = false;
                        //  Grab the next page of information.
                        var nextBatch = self.collection.slice(currentMaxRenderedIndex, currentMaxRenderedIndex + self.pageSize);

                        if (nextBatch.length > 0) {
                            self.maxRenderedIndex += nextBatch.length;

                            var lastChildIndex = self.children.last().index;
  
                            //  Leverage Marionette's style of rendering for performance.
                            self.initRenderBuffer();
                            self.startBuffering();

                            var ItemView;
                            _.each(nextBatch, function (item, index) {
                                ItemView = this.getItemView(item);
                                this.addItemView(item, ItemView, (index + lastChildIndex + 1));
                            }, self);

                            self.endBuffering();
                        }
                        
                        if (exceededSecondaryLoad) {
                            //  Cleanup N items where N is the amounts of items being added to the front.
                            var previousBatch = self.children.toArray().slice(0, nextBatch.length);

                            if (previousBatch.length > 0) {
                                //  TODO: Actually use minRenderedIndex, I'm sure it's useful for simplification...
                                self.minRenderedIndex += previousBatch.length;

                                _.each(previousBatch, function(child) {
                                    this.removeChildView(child);
                                }, self);
                            }
                        }

                    }
                } else {
                    //  TODO: Support scrolling up as well as down.
                }

                lastScrollTop = scrollTop;
            }, 100));
        },

        onRender: function () {            
            this.toggleBigText();
            this.toggleBottomMenubar();
            this._setHeight();

            MultiSelectCompositeView.prototype.onRender.call(this, arguments);
        },
        
        updatePlaylistDetails: function () {
            var displayInfo = this.model.get('displayInfo');

            this.ui.playlistDetails.text(displayInfo);
            
            //  Be sure to call render first or else setting content.text won't actually update it.
            this.ui.playlistDetails.qtip('render');
            this.ui.playlistDetails.qtip('option', 'content.text', displayInfo);
        },
       
        //  Set the visibility of any visible text messages.
        toggleBigText: function () {
            this.ui.playlistEmptyMessage.toggleClass('hidden', this.collection.length > 0);
        },
        
        toggleBottomMenubar: function () {
            this.ui.bottomMenubar.toggle(this.collection.length > 0);
            this.ui.bigTextWrapper.toggleClass('extended', this.collection.length === 0);
        },

        addAllToStream: function () {
            StreamItems.addSongs(this.model.get('items').pluck('song'));
        },
        
        playAllInStream: function() {
            StreamItems.addSongs(this.model.get('items').pluck('song'), {
                playOnAdd: true
            });
        },
        
        //  Set the elements height calculated from the number of potential items rendered into it.
        //  Necessary because items are lazy-appended for performance, but scrollbar size changing not desired.
        _setHeight: function () {
            //  TODO: 40 is hardcoded
            this.ui.itemContainer.height(this.collection.length * 40);
        }
    });

    return ActivePlaylistAreaView;
});