﻿define(function(require) {
    'use strict';

    var ListItemView = require('foreground/view/listItemView');
    var ListItemMultiSelect = require('foreground/view/behavior/itemViewMultiSelect');
    var AddSongButtonView = require('foreground/view/listItemButton/addSongButtonView');
    var PlayPauseSongButtonView = require('foreground/view/listItemButton/playPauseSongButtonView');
    var SaveSongButtonView = require('foreground/view/listItemButton/saveSongButtonView');
    var SearchResultTemplate = require('text!template/search/searchResult.html');
    var ContextMenuAction = require('foreground/model/contextMenuAction');

    var SearchResultView = ListItemView.extend({
        className: ListItemView.prototype.className + ' search-result listItem--medium listItem--hasButtons listItem--selectable',
        template: _.template(SearchResultTemplate),

        events: _.extend({}, ListItemView.prototype.events, {
            'dblclick': '_onDblClick'
        }),

        behaviors: _.extend({}, ListItemView.prototype.behaviors, {
            ListItemMultiSelect: {
                behaviorClass: ListItemMultiSelect
            }
        }),

        buttonViewOptions: function() {
            return {
                PlayPauseSongButtonView: {
                    viewClass: PlayPauseSongButtonView,
                    options: {
                        streamItems: Streamus.backgroundPage.stream.get('items'),
                        player: Streamus.backgroundPage.player
                    }
                },
                AddSongButtonView: {
                    viewClass: AddSongButtonView,
                    options: {
                        streamItems: Streamus.backgroundPage.stream.get('items')
                    }
                },
                SaveSongButtonView: {
                    viewClass: SaveSongButtonView,
                    options: {
                        signInManager: Streamus.backgroundPage.signInManager
                    }
                }
            };
        },

        streamItems: null,
        player: null,

        initialize: function(options) {
            this.streamItems = options.streamItems;
            this.player = options.player;
        },

        showContextMenu: function() {
            var contextMenuAction = new ContextMenuAction({
                song: this.model.get('song'),
                player: this.player
            });

            contextMenuAction.showContextMenu();
        },

        _onDblClick: function() {
            this._playInStream();
        },

        _playInStream: function() {
            this.streamItems.addSongs(this.model.get('song'), {
                playOnAdd: true
            });
        }
    });

    return SearchResultView;
});