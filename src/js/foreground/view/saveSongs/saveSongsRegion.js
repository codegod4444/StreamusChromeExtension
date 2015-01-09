﻿//  TODO: This is too specific of a usecase, I'd like to expand upon it in the future and make it generic, maybe combine it with ContextMenu if possible.
define([
    'foreground/collection/simpleMenuItems',
    'foreground/model/simpleMenu',
    'foreground/view/element/simpleMenuView',
    'foreground/view/prompt/createPlaylistPromptView'
], function (SimpleMenuItems, SimpleMenu, SimpleMenuView, CreatePlaylistPromptView) {
    'use strict';

    var SaveSongsRegion = Marionette.Region.extend({
        initialize: function() {
            this.listenTo(Streamus.channels.saveSongs.commands, 'show:simpleMenu', this._showSimpleMenu);
        },
        
        _showSimpleMenu: function (options) {
            var simpleMenuItems = new SimpleMenuItems(options.playlists.map(function (playlist) {
                return {
                    selected: playlist.get('active'),
                    text: playlist.get('title'),
                    value: playlist.get('id')
                };
            }));

            var simpleMenuView = new SimpleMenuView({
                collection: simpleMenuItems,
                model: new SimpleMenu({
                    fixedMenuItemTitle: chrome.i18n.getMessage('createPlaylist')
                })
            });

            simpleMenuView.on('click:simpleMenuItem', this._onClickSimpleMenuItem.bind(this, options.playlists, options.songs));
            simpleMenuView.on('click:fixedMenuItem', this._onClickFixedMenuItem.bind(this, options.songs));

            this.show(simpleMenuView);
            
            //  TODO: Maybe it's better to position completely over the button on flip? Would need a bit more math.
            var offsetTop = this._ensureOffset(options.top, simpleMenuView.$el.outerHeight(), this.$el.height());
            var offsetLeft = this._ensureOffset(options.left, simpleMenuView.$el.outerWidth(), this.$el.width());

            simpleMenuView.$el.offset({
                top: offsetTop,
                left: offsetLeft
            });
        },
        
        _onClickSimpleMenuItem: function (playlists, songs, eventArgs) {
            var selectedItem = eventArgs.collection.findWhere({ selected: true });
            var playlist = playlists.get(selectedItem.get('value'));
            playlist.get('items').addSongs(songs);
        },

        _onClickFixedMenuItem: function (songs) {
            Streamus.channels.prompt.commands.trigger('show:prompt', CreatePlaylistPromptView, {
                songs: songs
            });
        },

        //  TODO: Keep DRY w/ contextmenu
        //  Prevent displaying ContextMenu outside of viewport by ensuring its offsets are valid.
        _ensureOffset: function (offset, elementDimension, containerDimension) {
            var ensuredOffset = offset;
            var needsFlip = offset + elementDimension > containerDimension;

            if (needsFlip) {
                ensuredOffset -= elementDimension;
            }

            return ensuredOffset;
        }
    });

    return SaveSongsRegion;
});