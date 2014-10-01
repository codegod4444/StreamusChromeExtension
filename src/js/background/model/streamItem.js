﻿define([
    'background/model/song',
    'background/model/relatedSongInformationManager',
    'common/enum/listItemType'
], function (Song, RelatedSongInformationManager, ListItemType) {
    'use strict';
   
    var StreamItem = Backbone.Model.extend({
        defaults: function () {
            return {
                id: null,
                song: null,
                title: '',
                //  Used to weight randomness in shuffle. Resets to false when all in collection are set to true.
                playedRecently: false,
                active: false,
                selected: false,
                firstSelected: false,
                relatedSongInformation: [],
                sequence: -1,
                listItemType: ListItemType.StreamItem
            };
        },
        
        //  Don't want to save everything to localStorage -- only variables which need to be persisted.
        blacklist: ['selected', 'firstSelected'],
        toJSON: function () {
            return this.omit(this.blacklist);
        },
        
        initialize: function () {
            this._ensureSongModel();
            this.on('change:active', this._onChangeActive);
            
            if (this.get('relatedSongInformation').length === 0) {
                this._getRelatedSongInformation();
            }
        },
        
        _ensureSongModel: function() {
            var song = this.get('song');

            //  Need to convert song object to Backbone.Model
            if (!(song instanceof Backbone.Model)) {
                //  Silent because song is just being properly set.
                this.set('song', new Song(song), { silent: true });
            }
        },
        
        //  Whenever a streamItem is activated it is considered playedRecently.
        //  This will reset when all streamItems in the stream have been played recently.
        _onChangeActive: function(model, active) {
            if (active) {
                this.save({ playedRecently: true });
            }
        },
        
        //  A StreamItem's related song information is used when radio mode is enabled to allow users to discover new music.
        _getRelatedSongInformation: function () {
            RelatedSongInformationManager.getRelatedSongInformation({
                songId: this.get('song').get('id'),
                success: this._onGetRelatedSongInformationSuccess.bind(this)
            });
        },
        
        _onGetRelatedSongInformationSuccess: function(relatedSongInformation) {
            this.set('relatedSongInformation', relatedSongInformation);
        }
    });

    return StreamItem;
});