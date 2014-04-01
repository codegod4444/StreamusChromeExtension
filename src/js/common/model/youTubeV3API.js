﻿define([
    'common/model/utility',
    'common/enum/dataSourceType',
    'common/googleAPI'
], function (Utility, DataSourceType, GoogleAPI) {
    'use strict';

    var YouTubeV3API = Backbone.Model.extend({

        defaults: function () {
            return {
                loading: false,
                loaded: false
            };
        },

        initialize: function () {

            this.set('loading', true);

            this.setApiKey();

            GoogleAPI.client.load('youtube', 'v3', function () {
                this.set('loading', false);
                this.set('loaded', true);
            }.bind(this));

        },
        
        //  The API Key is set through here: https://code.google.com/apis/console/b/0/?noredirect#project:346456917689:access 
        //  It can expire from time to time. You need to generate a new Simple API Access token with the 'Browser key' with a Referer of 'http://localhost' for testing
        //  You need to generate a browser key with your PCs IP address for chrome extension testing. Not sure how this will work for deployment though!
        setApiKey: function () {

            //if (Settings.get('testing')) {
            //  This key corresponds to: http://localhost
            //GoogleAPI.client.setApiKey('AIzaSyD3_3QdKsYIQl13Jo-mBMDHr6yc2ScFBF0');
            //} else {
            //  This key corresponds to: 71.93.45.93
            GoogleAPI.client.setApiKey('AIzaSyCTeTdPhakrauzhWfMK9rC7Su47qdbaAGU');
            //}
        },
        
        _getSongInformationList: function(items, callback) {
            var songIds = _.map(items, function (item) {
                return item.contentDetails.videoId;
            });

            //  Now I need to take these songIds and get their information.
            var songsListRequest = GoogleAPI.client.youtube.videos.list({
                part: 'contentDetails,snippet',
                maxResults: 50,
                id: songIds.join(',')
            });

            songsListRequest.execute(function (response) {

                var songInformationList = _.map(response.items, function (item) {

                    return {
                        id: item.id,
                        duration: Utility.iso8061DurationToSeconds(item.contentDetails.duration),
                        title: item.snippet.title,
                        author: item.snippet.channelTitle
                    };

                });

                callback(songInformationList);
            });
        },

        //  Fetching an auto-generated playlist requires YouTube's v3 API.
        //  The v3 API does not serve up all the necessary information with the first request.
        //  Make two requests: one to get the list of song ids and a second to get the information
        getAutoGeneratedPlaylistData: function (playlistId, callback) {

            //  If the API is still in the process of loading - defer calling this event until ready.
            if (this.get('loading')) {
                this.once('change:loaded', function () {
                    this.getAutoGeneratedPlaylistData(playlistId, callback);
                });
                return;
            }

            if (!this.get('loaded')) throw 'gapi youtube v3 must be loaded before calling';

            var playlistItemsListRequest = GoogleAPI.client.youtube.playlistItems.list({
                part: 'contentDetails',
                maxResults: 50,
                playlistId: playlistId,
            });

            playlistItemsListRequest.execute(function (response) {

                this._getSongInformationList(response.items, function(songInformationList) {

                    if (callback) {
                        callback({
                            results: songInformationList
                        });
                    }

                });

            }.bind(this));

        },

        getAutoGeneratedPlaylistTitle: function (playlistId, callback) {

            //  If the API is still in the process of loading - defer calling this event until ready.
            if (this.get('loading')) {
                this.once('change:loaded', function () {
                    this.getAutoGeneratedPlaylistData(playlistId, callback);
                });
                return;
            }

            var playlistListRequest = GoogleAPI.client.youtube.playlists.list({
                part: 'snippet',
                id: playlistId,
            });

            playlistListRequest.execute(function (playlistListResponse) {
                if (callback) {

                    var playlistTitle = '';

                    if (playlistListResponse.items && playlistListResponse.items.length > 0) {
                        playlistTitle = playlistListResponse.items[0].snippet.title;
                    }

                    callback(playlistTitle);
                }
            });

        },

        //  Returns the results of a request for a segment of a channel, playlist, or other dataSource.
        getPlaylistItems: function (options) {

            //  TODO: Does this work with channels as well?
            var playlistListRequest = GoogleAPI.client.youtube.playlistItems.list({
                part: 'snippet,contentDetails',
                maxResults: 50,
                playlistId: options.playlistId,
                pageToken: options.pageToken || ''
            });
            
            playlistListRequest.execute(function (response) {

                if (response.error) {
                    if (options.error) {
                        options.error({
                            error: response.error
                        });
                    }
                } else {

                    this._getSongInformationList(response.items, function(songInformationList) {

                        options.success({
                            nextPageToken: response.nextPageToken,
                            results: songInformationList,
                            error: null
                        });

                    });

                }

            }.bind(this));

        },

        getRelatedSongInformation: function (options) {

            //  If the API is still in the process of loading - defer calling this event until ready.
            if (this.get('loading')) {
                this.once('change:loaded', function () {
                    this.getRelatedSongInformation(options);
                });
                return;
            }

            if (!this.get('loaded')) throw 'gapi youtube v3 must be loaded before calling';

            var relatedSongInformationRequest = GoogleAPI.client.youtube.search.list({
                part: 'snippet',
                relatedToVideoId: options.songId,
                maxResults: 10,
                //  If the relatedToVideoId parameter has been supplied, type must be video.
                type: 'video'
            });

            relatedSongInformationRequest.execute(function (relatedSongInformationResponse) {
                options.success(relatedSongInformationResponse);
            });

        }

        //doYouTubeLogin: function () {

        //  TODO: It seems like I should be able to use chrome-identity, but I guess not.
        //chrome.identity.getAuthToken({ 'interactive': true }, function (authToken) {

        //GoogleAPI.auth.setToken(authToken);
        // }

        //GoogleAPI.auth.authorize({
        //    client_id: '346456917689-dtfdla6c18cn78u3j5subjab1kiq3jls.apps.googleusercontent.com',
        //    scope: 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtubepartner',
        //    //  Set immediate to false if authResult returns null
        //    immediate: true
        //}, function (authResult) {

        //if (authResult == null) {

        //} else {

        //}

        //    GoogleAPI.client.load('youtube', 'v3', function () {

        //        var request = GoogleAPI.client.youtube.subscriptions.list({
        //            mine: true,
        //            part: 'contentDetails'
        //        });

        //        request.execute(function (response) {
        //        });
        //    });
        //});

        //},

    });

    return new YouTubeV3API();
});