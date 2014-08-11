﻿define([
    'foreground/view/prompt/settingsPromptView',
    'text!template/menuArea.html'
], function (SettingsPromptView, MenuAreaTemplate) {
    'use strict';

    var MenuAreaView = Backbone.Marionette.ItemView.extend({
        id: 'menu-area',
        template: _.template(MenuAreaTemplate),

        templateHelpers: {
            settings: chrome.i18n.getMessage('settings')
        },

        events: {
            'click @ui.menuButton': '_toggleMenu',
            'click @ui.settingsMenuItem': '_showSettingsPrompt'
        },

        ui: {
            menuButton: '.menu-button',
            menu: '.menu',
            settingsMenuItem: '.menu .settings',
            //  TODO: Implement a donation prompt.
            donateMenuItem: '.menu .donate'
        },
        
        menuShown: false,
        
        initialize: function () {
            //  TODO: What's a better way to hide this?
            $('body').on('click contextmenu', this._onClickBody.bind(this));
        },
        
        _onClickBody: function (event) {
            if ($(event.target).closest(this.ui.menuButton.selector).length === 0) {
                this._hideMenu();
            }
        },

        _toggleMenu: function () {
            this.menuShown ? this._hideMenu() : this._showMenu();
        },
        
        _showMenu: function () {
            this.ui.menu.show();
            this.menuShown = true;
        },
        
        _hideMenu: function () {
            this.ui.menu.hide();
            this.menuShown = false;
        },
        
        _showSettingsPrompt: function () {
            Backbone.Wreqr.radio.channel('prompt').vent.trigger('show', SettingsPromptView);
        }
    });

    return MenuAreaView;
});