﻿define([
    'background/collection/multiSelectCollection',
    'background/model/searchResult',
    'background/model/song'
], function (MultiSelectCollection, SearchResult, Song) {
    'use strict';
    
    //  If the foreground requests, don't instantiate -- return existing from the background.
    if (!_.isUndefined(chrome.extension.getBackgroundPage().window.SearchResults)) {
        console.log("Returning bg searchResults");
        return chrome.extension.getBackgroundPage().window.SearchResults;
    }

    var SearchResults = MultiSelectCollection.extend({
        //state: {
        //    firstPage: 0,
        //    sortKey: 'index'
        //},

        model: SearchResult,
        
        setFromSongInformation: function (songInformation) {

            var song = new Song();
            song.setYouTubeInformation(songInformation);

            var searchResult = new SearchResult({
                song: song
            });
            
            this.reset(searchResult);
        },

        setFromSongInformationList: function (songInformationList) {

            var searchResults = _.map(songInformationList, function (songInformation) {

                var song = new Song();
                song.setYouTubeInformation(songInformation);

                var searchResult = new SearchResult({
                    song: song
                });

                return searchResult;
            });

            this.reset(searchResults);
        },
        
        getBySongId: function (songId) {
            var foundSearchResult = this.find(function(searchResult) {
                return searchResult.get('song').get('id') === songId;
            });

            return foundSearchResult;
        },
        
        //  Returns the underlying Songs of the selected SearchResults.
        getSelectedSongs: function() {
            return _.map(this.selected(), function (searchResult) {
                return searchResult.get('song');
            });
        }
        
    });

    //  Exposed globally so that the foreground can access the same instance through chrome.extension.getBackgroundPage()
    window.SearchResults = new SearchResults();
    return window.SearchResults;
});