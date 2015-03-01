﻿define(function(require) {
    'use strict';

    var PlaylistItem = require('background/model/playlistItem');
    var TestUtility = require('test/testUtility');

    describe('PlaylistItem', function() {
        it('Should set its title properly when being created with a Song object', function() {
            var song = TestUtility.buildSong();

            var playlistItem = new PlaylistItem({
                title: song.get('title'),
                song: song
            });

            expect(playlistItem.get('title')).to.equal(song.get('title'));
        });

        it('Should set its title properly when being created with raw Song data', function() {
            var song = TestUtility.getRawSong();

            var playlistItem = new PlaylistItem({
                title: song.title,
                song: song
            });

            expect(playlistItem.get('title')).to.equal(song.title);
        });
    });
});