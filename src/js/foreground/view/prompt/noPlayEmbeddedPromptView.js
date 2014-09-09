﻿define([
    'foreground/model/genericPrompt',
    'foreground/view/noPlayEmbeddedView',
    'foreground/view/prompt/genericPromptView'
], function (GenericPrompt, NoPlayEmbeddedView, GenericPromptView) {
    'use strict';
    
    var Player = Streamus.backgroundPage.YouTubePlayer;

    var NoPlayEmbeddedPromptView = GenericPromptView.extend({
        initialize: function () {
            this.model = new GenericPrompt({
                title: chrome.i18n.getMessage('errorEncountered'),
                okButtonText: chrome.i18n.getMessage('reload'),
                view: new NoPlayEmbeddedView()
            });
            
            GenericPromptView.prototype.initialize.apply(this, arguments);

            Streamus.backgroundPage.ClientErrorManager.logErrorMessage("NoPlayEmbeddedView shown, loadedSongId:" + Player.get('loadedSongId'));
        }
    });

    return NoPlayEmbeddedPromptView;
});