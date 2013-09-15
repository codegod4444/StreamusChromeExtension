//  This is the list of playlists on the playlists tab.
define([
    'contextMenuView',
    'utility',
    'dataSource',
    'streamItems',
    'playlistView',
    'loadingSpinnerView'
], function (ContextMenuView, Utility, DataSource, StreamItems, PlaylistView, LoadingSpinnerView) {
    'use strict';

    var ActiveFolderView = Backbone.View.extend({
        
        el: $('#ActiveFolderView'),

        ul: $('#ActiveFolderView ul'),
        
        emptyNotification: $('#ActiveFolderView .emptyListNotification'),
        
        loadingSpinnerView: new LoadingSpinnerView,
        
        events: {
            'contextmenu': 'showContextMenu',
            'contextmenu li': 'showItemContextMenu',
            'click ul li': 'selectPlaylist'
        },
        
        //  Refreshes the playlist display with the current playlist information.
        render: function () {
            this.ul.empty();

            //  TODO: Change this to a template.
            var activeFolder = this.model;

            if (activeFolder.get('playlists').length === 0) {
                this.emptyNotification.show();
            } else {
                this.emptyNotification.hide();
                
                var firstPlaylistId = activeFolder.get('firstPlaylistId');
                var playlist = activeFolder.get('playlists').get(firstPlaylistId);

                //  Build up the ul of li's representing each playlist.
                var listItems = [];
                do {

                    var playlistView = new PlaylistView({
                        model: playlist
                    });

                    var element = playlistView.render().el;
                    listItems.push(element);

                    var nextPlaylistId = playlist.get('nextPlaylistId');
                    playlist = activeFolder.get('playlists').get(nextPlaylistId);

                } while (playlist.get('id') !== firstPlaylistId)
                
                //  Do this all in one DOM insertion to prevent lag in large folders.
                this.ul.append(listItems);

                //  TODO: This is probably partially handled by the PlaylistView not ActiveFolderView
                //  TODO: I presume this is still useful, but activePlaylistView doesn't have it so I need to double check.
                var activePlaylist = this.model.getActivePlaylist();
                this.visuallySelectPlaylist(activePlaylist);
            }

            return this;
        },
        
        initialize: function () {
            //  TODO: Sortable.
            this.emptyNotification.text(chrome.i18n.getMessage("emptyFolder"));

            this.startListeningToPlaylists(this.model.get('playlists'));
            this.render();

            Utility.scrollChildElements(this.el, 'span.playlitTitle');

            //  todo: find a place for this
            var activePlaylist = this.model.getActivePlaylist();
            this.scrollItemIntoView(activePlaylist, false);
        },
        
        changeModel: function(newModel) {

            this.stopListening(this.model.get('playlists'));

            this.model = newModel;
            this.startListeningToPlaylists(newModel.get('playlists'));

            this.render();
        },

        startListeningToPlaylists: function (playlists) {
            var self = this;

            this.listenTo(playlists, 'change:active', function (playlist, isActive) {

                if (isActive) {
                    self.visuallySelectPlaylist(playlist);
                } else {
                    //  TODO: Change from loaded to active.
                    self.ul.find('li').removeClass('loaded');
                }

            });

            //  TODO: Do I even call playlists.reset anymore?
            this.listenTo(playlists, 'reset empty', this.render);
            this.listenTo(playlists, 'add', this.addItem);

        },

        addItem: function (playlist) {

            var playlistView = new PlaylistView({
                model: playlist
            });

            var element = playlistView.render().$el;

            if (this.ul.find('li').length > 0) {

                var previousPlaylistId = playlist.get('previousPlaylistId');
                var previousPlaylistLi = this.ul.find('li[data-playlistid="' + previousPlaylistId + '"]');
                element.insertAfter(previousPlaylistLi);

            } else {
                element.appendTo(this.ul);
            }

            if (playlist.has('dataSource')) {

                var dataSourceType = playlist.get('dataSource').type;

                if (dataSourceType === DataSource.YOUTUBE_PLAYLIST || dataSourceType === DataSource.YOUTUBE_CHANNEL || dataSourceType === DataSource.YOUTUBE_FAVORITES) {

                    if (!playlist.get('dataSourceLoaded')) {

                        var playlistLi = this.ul.find('li[data-playlistid="' + playlist.get('id') + '"]');
                        playlistLi.append(this.loadingSpinnerView.render().el);

                        var self = this;
                        playlist.once('change:dataSourceLoaded', function () {
                            self.loadingSpinnerView.remove();
                        });

                    }

                }
            }

            this.emptyNotification.hide();
            this.scrollItemIntoView(playlist, true);
        },
        
        //  TODO: Folder otpions.
        showContextMenu: function(event) {
            
        },
        
        showItemContextMenu: function (event) {
            
            var clickedPlaylistId = $(event.currentTarget).data('playlistid');
            var clickedPlaylist = this.model.get('playlists').get(clickedPlaylistId);

            //  Don't allow deleting of the last playlist in a folder ( at least for now )
            var isDeleteDisabled = clickedPlaylist.get('nextPlaylistId') === clickedPlaylist.get('id');
            var isAddPlaylistDisabled = clickedPlaylist.get('items').length === 0;

            ContextMenuView.addGroup({
                position: 0,
                items: [{
                    position: 0,
                    text: chrome.i18n.getMessage("copyUrl"),
                    onClick: function () {

                        clickedPlaylist.getShareCode(function (shareCode) {

                            var shareCodeShortId = shareCode.get('shortId');
                            var urlFriendlyEntityTitle = shareCode.get('urlFriendlyEntityTitle');

                            var playlistShareUrl = 'http://share.streamus.com/playlist/' + shareCodeShortId + '/' + urlFriendlyEntityTitle;

                            chrome.extension.sendMessage({
                                method: 'copy',
                                text: playlistShareUrl
                            });

                        });

                    }
                }, {
                    position: 1,
                    text: chrome.i18n.getMessage("delete"),
                    disabled: isDeleteDisabled,
                    title: isDeleteDisabled ? chrome.i18n.getMessage("lastPlaylistNoDeleteWarning") : '',
                    onClick: function () {

                        if (!isDeleteDisabled) {
                            clickedPlaylist.destroy();
                        }
                    }
                }, {
                    position: 2,
                    text: chrome.i18n.getMessage("addPlaylistToStream"),
                    disabled: isAddPlaylistDisabled,
                    title: isAddPlaylistDisabled ? chrome.i18n.getMessage("addPlaylistNoAddStreamWarning") : '',
                    onClick: function () {

                        if (!isAddPlaylistDisabled) {

                            var streamItems = clickedPlaylist.get('items').map(function (playlistItem) {
                                return {
                                    id: _.uniqueId('streamItem_'),
                                    video: playlistItem.get('video'),
                                    title: playlistItem.get('title'),
                                    videoImageUrl: 'http://img.youtube.com/vi/' + playlistItem.get('video').get('id') + '/default.jpg'
                                };
                            });

                            StreamItems.addMultiple(streamItems);
                        }

                    }
                }]
            });

            ContextMenuView.show({
                top: event.pageY,
                left: event.pageX + 1
            });

            return false;
        },
        
        selectPlaylist: function(event) {
            var playlistId = $(event.currentTarget).data('playlistid');
            var playlist = this.model.getPlaylistById(playlistId);

            //  If the playlist is already active - do nothing
            if (!playlist.get('active')) {
                //  Deselect the presently active playlist before marking the new one as active.
                var activePlaylist = this.model.getActivePlaylist();
                activePlaylist.set('active', false);
                playlist.set('active', true);
            }
        },
        
        //  TODO: This doesn't seem to be working.
        //  TODO: Needs to be dry with activePlaylistView
        scrollItemIntoView: function (activePlaylist, useAnimation) {

            //  Since we emptied our list we lost the selection, reselect.
            if (activePlaylist) {
                
                var activePlaylistId = activePlaylist.get('id');
                var activeListItem = this.ul.find('li[data-playlistid="' + activePlaylistId + '"]');

                if (activeListItem.length > 0) {
                    activeListItem.scrollIntoView(useAnimation);
                }
            }
            
        },
        
        //  Removes the old 'current' marking and move it to the newly selected row.
        visuallySelectPlaylist: function(playlist) {
            this.scrollItemIntoView(playlist, false);

            this.ul.find('li').removeClass('loaded');
            this.ul.find('li[data-playlistid="' + playlist.get('id') + '"]').addClass('loaded');
        }

    });

    return ActiveFolderView;
});