﻿define([
    'foreground/view/prompt/settingsPromptView',
    'foreground/view/prompt/browserSettingsPromptView',
    'text!template/appBar/adminMenuArea.html'
], function (SettingsPromptView, BrowserSettingsPromptView, AdminMenuAreaTemplate) {
    'use strict';
    
    var AdminMenuAreaView = Marionette.ItemView.extend({
        id: 'adminMenuArea',
        template: _.template(AdminMenuAreaTemplate),
        
        templateHelpers: {
            settingsMessage: chrome.i18n.getMessage('settings'),
            browserSettingsMessage: chrome.i18n.getMessage('browserSettings'),
            keyboardShortcutsMessage: chrome.i18n.getMessage('keyboardShortcuts'),
            viewInTabMessage: chrome.i18n.getMessage('viewInTab'),
            reloadMessage: chrome.i18n.getMessage('reload')
        },
        
        ui: function () {
            return {
                menuButton: '#' + this.id + '-menuButton',
                menu: '#' + this.id + '-menu',
                settingsMenuItem: '#' + this.id + '-settingsMenuItem',
                browserSettingsMenuItem: '#' + this.id + '-browserSettingsMenuItem',
                viewInTabMenuItem: '#' + this.id + '-viewInTabMenuItem',
                keyboardShortcutsMenuItem: '#' + this.id + '-keyboardShortcutsMenuItem',
                restartMenuItem: '#' + this.id + '-reloadMenuItem'
            };
        },

        events: {
            'click @ui.menuButton': '_onClickMenuButton',
            'click @ui.settingsMenuItem': '_onClickSettingsMenuItem',
            'click @ui.browserSettingsMenuItem': '_onClickBrowserSettingsMenuItem',
            'click @ui.keyboardShortcutsMenuItem': '_onClickKeyboardShortcutsMenuItem',
            'click @ui.viewInTabMenuItem': '_onClickViewInTabMenuItem',
            'click @ui.restartMenuItem': '_onClickRestartMenuItem'
        },
        
        modelEvents: {
            'change:menuShown': '_onChangeMenuShown'
        },

        tabManager: null,
        
        initialize: function () {
            this.tabManager = Streamus.backgroundPage.tabManager;
            
            this.listenTo(Streamus.channels.element.vent, 'drag', this._onElementDrag);
            this.listenTo(Streamus.channels.element.vent, 'click', this._onElementClick);
        },
        
        _onClickMenuButton: function () {
            this.model.set('menuShown', !this.model.get('menuShown'));
        },
        
        _onClickSettingsMenuItem: function () {
            Streamus.channels.prompt.commands.trigger('show:prompt', SettingsPromptView);
        },
        
        _onClickBrowserSettingsMenuItem: function() {
            Streamus.channels.prompt.commands.trigger('show:prompt', BrowserSettingsPromptView);
        },
        
        _onClickKeyboardShortcutsMenuItem: function() {
            this.tabManager.showKeyboardShortcutsTab();
        },
        
        _onClickViewInTabMenuItem: function() {
            this.tabManager.showStreamusTab();
        },
        
        _onClickRestartMenuItem: function () {
            chrome.runtime.reload();
        },
        
        _onElementDrag: function () {
            this.model.set('menuShown', false);
        },
        
        _onElementClick: function (event) {
            //  If the user clicks anywhere on the page except for this menu button -- hide the menu.
            if ($(event.target).closest(this.ui.menuButton.selector).length === 0) {
                this.model.set('menuShown', false);
            }
        },
        
        _onChangeMenuShown: function (model, menuShown) {
            if (menuShown) {
                this._showMenu();
            } else {
                this._hideMenu();
            }
        },
        
        _showMenu: function () {
            this.ui.menu.addClass('is-visible');
        },
        
        _hideMenu: function () {
            this.ui.menu.removeClass('is-visible');
        }
    });

    return AdminMenuAreaView;
});