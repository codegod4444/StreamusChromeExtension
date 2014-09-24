﻿define([
    'foreground/model/prompt',
    'foreground/view/deletePlaylistView',
    'foreground/view/prompt/promptView'
], function (Prompt, DeletePlaylistView, PromptView) {
    'use strict';
    
    var DeletePlaylistPromptView = PromptView.extend({
        initialize: function (options) {
            this.model = new Prompt({
                title: chrome.i18n.getMessage('deletePlaylist'),
                okButtonText: chrome.i18n.getMessage('delete'),
                reminderProperty: 'remindDeletePlaylist',
                view: new DeletePlaylistView({
                    model: options.playlist
                })
            });

            PromptView.prototype.initialize.apply(this, arguments);
        }
    });

    return DeletePlaylistPromptView;
});