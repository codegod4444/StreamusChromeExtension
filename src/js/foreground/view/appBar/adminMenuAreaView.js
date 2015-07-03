﻿define(function(require) {
  'use strict';

  var SettingsDialogView = require('foreground/view/dialog/settingsDialogView');
  var AboutStreamusDialogView = require('foreground/view/dialog/aboutStreamusDialogView');
  var AdminMenuAreaTemplate = require('text!template/appBar/adminMenuArea.html');
  var SettingsIcon = require('text!template/icon/settingsIcon_24.svg');

  var AdminMenuAreaView = Marionette.ItemView.extend({
    id: 'adminMenuArea',
    template: _.template(AdminMenuAreaTemplate),

    templateHelpers: {
      settingsMessage: chrome.i18n.getMessage('settings'),
      keyboardShortcutsMessage: chrome.i18n.getMessage('keyboardShortcuts'),
      openInTabMessage: chrome.i18n.getMessage('openInTab'),
      aboutStreamusMessage: chrome.i18n.getMessage('aboutStreamus'),
      reloadMessage: chrome.i18n.getMessage('reload'),
      settingsIcon: _.template(SettingsIcon)()
    },

    ui: {
      menuButton: '[data-ui~=menuButton]',
      menu: '[data-ui~=menu]',
      settings: '[data-ui~=settings]',
      openInTab: '[data-ui~=openInTab]',
      keyboardShortcuts: '[data-ui~=keyboardShortcuts]',
      aboutStreamus: '[data-ui~=aboutStreamus]',
      restart: '[data-ui~=reload]'
    },

    events: {
      'click @ui.menuButton': '_onClickMenuButton',
      'click @ui.settings': '_onClickSettings',
      'click @ui.keyboardShortcuts': '_onClickKeyboardShortcuts',
      'click @ui.openInTab': '_onClickOpenInTab',
      'click @ui.aboutStreamus': '_onClickAboutStreamus',
      'click @ui.restart': '_onClickRestart'
    },

    modelEvents: {
      'change:menuShown': '_onChangeMenuShown'
    },

    tabManager: null,

    elementEvents: {
      'drag': '_onElementDrag',
      'click': '_onElementClick'
    },

    initialize: function(options) {
      this.tabManager = options.tabManager;
      this.bindEntityEvents(StreamusFG.channels.element.vent, this.elementEvents);
    },

    _onClickMenuButton: function() {
      this.model.set('menuShown', !this.model.get('menuShown'));
    },

    _onClickSettings: function() {
      StreamusFG.channels.dialog.commands.trigger('show:dialog', SettingsDialogView);
    },

    _onClickKeyboardShortcuts: function() {
      this.tabManager.showKeyboardShortcutsTab();
    },

    _onClickOpenInTab: function() {
      this.tabManager.showStreamusTab();
    },

    _onClickAboutStreamus: function() {
      StreamusFG.channels.dialog.commands.trigger('show:dialog', AboutStreamusDialogView);
    },

    _onClickRestart: function() {
      chrome.runtime.reload();
    },

    _onElementDrag: function() {
      this.model.set('menuShown', false);
    },

    _onElementClick: function(event) {
      // If the user clicks anywhere on the page except for this menu button -- hide the menu.
      if ($(event.target).closest(this.ui.menuButton.selector).length === 0) {
        this.model.set('menuShown', false);
      }
    },

    _onChangeMenuShown: function(model, menuShown) {
      if (menuShown) {
        this._showMenu();
      } else {
        this._hideMenu();
      }
    },

    _showMenu: function() {
      this.ui.menu.addClass('is-visible');
    },

    _hideMenu: function() {
      this.ui.menu.removeClass('is-visible');
    }
  });

  return AdminMenuAreaView;
});
