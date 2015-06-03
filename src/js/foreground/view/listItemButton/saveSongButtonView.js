﻿define(function(require) {
  'use strict';

  var ListItemButton = require('foreground/view/behavior/listItemButton');
  var SongActions = require('foreground/model/song/songActions');
  var SaveListItemButtonTemplate = require('text!template/listItemButton/saveListItemButton.html');
  var SaveIconTemplate = require('text!template/icon/saveIcon_18.svg');

  var SaveSongButtonView = Marionette.ItemView.extend({
    template: _.template(SaveListItemButtonTemplate),
    templateHelpers: {
      saveIcon: _.template(SaveIconTemplate)()
    },

    behaviors: {
      ListItemButton: {
        behaviorClass: ListItemButton
      }
    },

    signInManager: null,
    song: null,

    initialize: function(options) {
      this.song = options.song;
      this.signInManager = options.signInManager;
      this.listenTo(this.signInManager, 'change:signedInUser', this._onSignInManagerChangeSignedInUser);
    },

    onRender: function() {
      this._setState();
    },

    onClick: function() {
      var songActions = new SongActions();
      var offset = this.$el.offset();
      var playlists = this.signInManager.get('signedInUser').get('playlists');

      songActions.showSaveMenu(this.song, offset.top, offset.left, playlists);
    },

    _onSignInManagerChangeSignedInUser: function() {
      this._setState();
    },

    _setState: function() {
      var signedIn = this.signInManager.has('signedInUser');

      var tooltipText = signedIn ? chrome.i18n.getMessage('save') : chrome.i18n.getMessage('notSignedIn');
      this.$el.attr('data-tooltip-text', tooltipText).toggleClass('is-disabled', !signedIn);
      this.model.set('enabled', signedIn);
    }
  });

  return SaveSongButtonView;
});