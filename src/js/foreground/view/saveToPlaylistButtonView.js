﻿define([
    'foreground/view/behavior/tooltip',
    'foreground/view/prompt/saveSongsPromptView',
    'text!template/saveToPlaylistButton.html'
], function (Tooltip, SaveSongsPromptView, SaveToPlaylistButtonTemplate) {
    'use strict';

    var SignInManager = Streamus.backgroundPage.SignInManager;

    var SaveToPlaylistButtonView = Backbone.Marionette.ItemView.extend({
        tagName: 'button',
        className: 'button-icon',
        template: _.template(SaveToPlaylistButtonTemplate),
        
        attributes: {
            title: chrome.i18n.getMessage('cantSaveNotSignedIn')
        },

        events: {
            'click': '_saveToPlaylist',
            'dblclick': '_saveToPlaylist'
        },
        
        behaviors: {
            Tooltip: {
                behaviorClass: Tooltip
            }
        },

        initialize: function () {
            this.listenTo(SignInManager, 'change:signedIn', this._setTitleAndDisabled);
        },

        onRender: function() {
            this._setTitleAndDisabled();
        },

        _saveToPlaylist: _.debounce(function () {
            // Return false even on disabled button click so the click event does not bubble up and select the item. 
            if (!this.$el.hasClass('disabled')) {
                this._showSaveSongsPrompt();
            }

            //  Don't allow dblclick to bubble up to the list item and cause a play.
            return false;
        }, 100, true),
        
        _setTitleAndDisabled: function () {
            var signedIn = SignInManager.get('signedIn');

            var title = signedIn ? chrome.i18n.getMessage('save') : chrome.i18n.getMessage('cantSaveNotSignedIn');
            this.$el.attr('title', title).toggleClass('disabled', !signedIn);
        },
        
        _showSaveSongsPrompt: function() {
            Backbone.Wreqr.radio.channel('prompt').vent.trigger('show', SaveSongsPromptView, {
                songs: [this.model.get('song')]
            });
        }
    });

    return SaveToPlaylistButtonView;
});