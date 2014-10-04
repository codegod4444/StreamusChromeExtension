﻿define([
    'background/model/chromeNotifications'
], function (ChromeNotifications) {
    'use strict';
    
    var ShuffleButton = Backbone.Model.extend({
        localStorage: new Backbone.LocalStorage('ShuffleButton'),
        
        defaults: {
            //  Need to set the ID for Backbone.LocalStorage
            id: 'ShuffleButton',
            enabled: false
        },
        
        initialize: function () {
            //  Load from Backbone.LocalStorage
            this.fetch();
            
            chrome.commands.onCommand.addListener(this._onChromeCommand.bind(this));
        },

        toggleEnabled: function () {
            this.save({
                enabled: !this.get('enabled')
            });
        },

        _onChromeCommand: function (command) {
            if (command === 'toggleShuffle') {
                this.toggleEnabled();
                
                ChromeNotifications.create({
                    //  TODO: i18n
                    message: this.get('enabled') ? 'Shuffling on' : 'Shuffling off'
                });
            }
        }
    });

    //  Exposed globally so that the foreground can access the same instance through chrome.extension.getBackgroundPage()
    window.ShuffleButton = new ShuffleButton();
    return window.ShuffleButton;
});