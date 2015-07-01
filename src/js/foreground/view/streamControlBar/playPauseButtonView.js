﻿define(function(require) {
  'use strict';

  var PlayPauseButtonTemplate = require('text!template/streamControlBar/playPauseButton.html');
  var PauseIconTemplate = require('text!template/icon/pauseIcon_30.svg');
  var PlayIconTemplate = require('text!template/icon/playIcon_30.svg');

  var PlayPauseButtonView = Marionette.ItemView.extend({
    id: 'playPauseButton',
    className: 'button button--icon button--icon--primary button--large',
    template: _.template(PlayPauseButtonTemplate),

    templateHelpers: {
      pauseIcon: _.template(PauseIconTemplate)(),
      playIcon: _.template(PlayIconTemplate)()
    },

    ui: {
      playIcon: '[data-ui~=playIcon]',
      pauseIcon: '[data-ui~=pauseIcon]'
    },

    events: {
      'click': '_onClick'
    },

    modelEvents: {
      'change:enabled': '_onChangeEnabled'
    },

    player: null,

    initialize: function(options) {
      this.player = options.player;
      this.listenTo(this.player, 'change:state', this._onPlayerChangeState);

      this.listenTo(StreamusFG.channels.playPauseButton.commands, 'tryToggle:playerState', this._tryTogglePlayerState);
    },

    onRender: function() {
      this._setState(this.model.get('enabled'));
    },

    _onClick: function() {
      this._tryTogglePlayerState();
    },

    _tryTogglePlayerState: function() {
      this.model.tryTogglePlayerState();
    },

    _onChangeEnabled: function(model, enabled) {
      this._setState(enabled, this.player.get('state'));
    },

    _onPlayerChangeState: function() {
      this._setState(this.model.get('enabled'));
    },

    _setState: function(enabled) {
      this.$el.toggleClass('is-disabled', !enabled);

      var isPausable = this.player.isPausable();
      this.ui.pauseIcon.toggleClass('is-hidden', !isPausable);
      this.ui.playIcon.toggleClass('is-hidden', isPausable);
    }
  });

  return PlayPauseButtonView;
});