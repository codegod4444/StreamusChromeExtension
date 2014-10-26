﻿define([
    'background/collection/searchResults',
    'background/model/dataSource',
    'background/model/youTubeV3API',
    'common/enum/dataSourceType'
], function (SearchResults, DataSource, YouTubeV3API, DataSourceType) {
    'use strict';

    var Search = Backbone.Model.extend({
        defaults: function () {
            return {
                //  TODO: It's weird this one is called results and Stream/Playlist are both items.
                results: new SearchResults(),
                query: '',
                searching: false,
                debounceSearchQueued: false,
                pendingRequests: 0,
                clearQueryTimeout: null
            };
        },
        
        initialize: function () {
            this.on('change:query', this._search);
        },
        
        startClearQueryTimer: function () {
            //  Safe-guard against multiple setTimeouts, just incase.
            this.stopClearQueryTimer();
            this.set('clearQueryTimeout', setTimeout(this._clearQuery.bind(this), 10000));
        },

        //  The foreground has to be able to call this whenever a view opens.
        stopClearQueryTimer: function () {
            window.clearTimeout(this.get('clearQueryTimeout'));
            this.set('clearQueryTimeout', null);
        },

        //  Whether anything has been typed into the query at all -- regardless of whether that is just whitespace or not.
        hasQuery: function() {
            return this.get('query') !== '';
        },
        
        //  Only search on queries which actually contain text. Different from hasQuery because want to show no search results when they type 'space'
        _hasSearchableQuery: function () {
            return this._getTrimmedQuery() !== '';
        },
        
        _getTrimmedQuery: function () {
            return this.get('query').trim();
        },
        
        //  Perform a search on the given query or just terminate immediately if nothing to do.
        _search: function () {
            this._clearResults();

            if (this._hasSearchableQuery()) {
                this._startSearching();
            } else {
                this.set('searching', false);
            }
        },
        
        //  Set some flags indicating that a search is in progress.
        _startSearching: function () {
            this.set('searching', true);
            this.set('debounceSearchQueued', true);
            //  Debounce a search request so that when the user stops typing the last request will run.
            this._doDebounceSearch(this._getTrimmedQuery());
        },
        
        _onSearchComplete: function () {
            this.set('pendingRequests', this.get('pendingRequests') - 1);

            if (!this._hasSearchPending()) {
                this.set('searching', false);
            }
        },
        
        //  Handle the actual search functionality inside of a debounced function.
        //  This is so I can tell when the user starts typing, but not actually run the search logic until they pause.
        _doDebounceSearch: _.debounce(function (query) {
            this.set('debounceSearchQueued', false);

            //  If the user is just typing in whatever -- search for it, otherwise handle special data sources.
            var dataSource = new DataSource({
                url: query
            });

            dataSource.parseUrl({
                //  TODO: Reduce nesting here.
                success: function () {
                    this.set('pendingRequests', this.get('pendingRequests') + 1);

                    //  If the search query had a valid YouTube Video ID inside of it -- display that result, otherwise search.
                    if (dataSource.get('type') === DataSourceType.YouTubeVideo) {
                        YouTubeV3API.getSongInformation({
                            songId: dataSource.get('id'),
                            success: function (songInformation) {
                                //  Don't show old responses. Even with xhr.abort() there's a point in time where the data could get through to the callback.
                                if (query === this._getTrimmedQuery()) {
                                    this.get('results').setFromSongInformationList(songInformation);
                                }
                            }.bind(this),
                            //  TODO: Handle error.
                            error: function (error) { },
                            complete: this._onSearchComplete.bind(this)
                        });
                    } else {
                        YouTubeV3API.search({
                            text: query,
                            success: function (searchResponse) {
                                //  Don't show old responses. Even with xhr.abort() there's a point in time where the data could get through to the callback.
                                if (query === this._getTrimmedQuery()) {
                                    this.get('results').setFromSongInformationList(searchResponse.songInformationList);
                                }
                            }.bind(this),
                            //  TODO: Handle error.
                            error: function (error) { },
                            complete: this._onSearchComplete.bind(this)
                        });
                    }
                }.bind(this)
            });
        }, 350),
        
        _clearResults: function () {
            //  Might as well not trigger excess reset events if they can be avoided.
            var results = this.get('results');            
            if (results.length > 0) {
                results.reset();
            }
        },
        
        _clearQuery: function () {
            this.set('query', '');
        },
        
        _hasSearchPending: function() {
            return this.get('debounceSearchQueued') || this.get('pendingRequests') !== 0;
        }
    });

    return Search;
});