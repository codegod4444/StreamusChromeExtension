﻿define([
    'foreground/view/leftCoveringPane/playlistsAreaView',
    'foreground/view/leftCoveringPane/searchView'
], function (PlaylistsAreaView, SearchView) {
    'use strict';
    
    var Search = chrome.extension.getBackgroundPage().Search;
    var Settings = chrome.extension.getBackgroundPage().Settings;
    var Playlists = chrome.extension.getBackgroundPage().Playlists;

    var LeftCoveringPaneRegion = Backbone.Marionette.Region.extend({
        el: '#left-covering-pane-region',
        
        initialize: function () {
            this.listenTo(Backbone.Wreqr.radio.channel('global').vent, 'showSearch', this.showSearchView);
            this.listenTo(Backbone.Wreqr.radio.channel('global').vent, 'showPlaylistsArea', this.showPlaylistsAreaView);
            
            if (Settings.get('alwaysOpenToSearch')) {
                this.showSearchView(false);
            }
        },

        showSearchView: function (doSnapAnimation) {
            this._searchViewExists() ? this._shakeSearchView() : this._createSearchView(doSnapAnimation);
        },
        
        showPlaylistsAreaView: function () {
            if (!this._playlistsAreaViewExists()) {
                this._createPlaylistsAreaView();
            }
        },
        
        //  Returns true if SearchView is currently shown
        _searchViewExists: function () {
            return !_.isUndefined(this.currentView) && this.currentView instanceof SearchView;
        },
        
        //  Shake the SearchView to bring attention to it -- the user might not have realized it is already open.
        _shakeSearchView: function() {
            this.currentView.shake();
        },
        
        _createSearchView: function (doSnapAnimation) {
            var searchView = new SearchView({
                collection: Search.get('results'),
                model: Search,
                //  Indicate whether view should appear immediately or animate.
                doSnapAnimation: doSnapAnimation
            });

            this.show(searchView);
        },
        
        //  Returns true if PlaylistsAreaView is currently shown
        _playlistsAreaViewExists: function () {
            return !_.isUndefined(this.currentView) && this.currentView instanceof PlaylistsAreaView;
        },
        
        _createPlaylistsAreaView: function() {
            var playlistsAreaView = new PlaylistsAreaView({
                collection: Playlists
            });
            
            this.show(playlistsAreaView);
        }
    });

    return LeftCoveringPaneRegion;
});