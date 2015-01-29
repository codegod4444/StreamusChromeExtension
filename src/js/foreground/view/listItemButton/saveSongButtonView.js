﻿define(function (require) {
    'use strict';

    var ListItemButtonView = require('foreground/view/listItemButton/listItemButtonView');
    var SaveListItemButtonTemplate = require('text!template/listItemButton/saveListItemButton.html');

    var SaveSongButtonView = ListItemButtonView.extend({
        template: _.template(SaveListItemButtonTemplate),

        signInManager: null,

        initialize: function () {
            this.signInManager = Streamus.backgroundPage.signInManager;
            this.listenTo(this.signInManager, 'change:signedInUser', this._onSignInManagerChangeSignedInUser);
            
            ListItemButtonView.prototype.initialize.apply(this, arguments);
        },

        onRender: function() {
            this._setState();
        },

        doOnClickAction: function () {
            var offset = this.$el.offset();

            Streamus.channels.saveSongs.commands.trigger('show:simpleMenu', {
                playlists: this.signInManager.get('signedInUser').get('playlists'),
                songs: [this.model.get('song')],
                top: offset.top,
                left: offset.left
            });
        },
        
        _onSignInManagerChangeSignedInUser: function() {
            this._setState();
        },
        
        _setState: function () {
            var signedIn = this.signInManager.get('signedInUser') !== null;

            var title = signedIn ? chrome.i18n.getMessage('save') : chrome.i18n.getMessage('notSignedIn');
            this.$el.attr('title', title).toggleClass('is-disabled', !signedIn);
        }
    });

    return SaveSongButtonView;
});