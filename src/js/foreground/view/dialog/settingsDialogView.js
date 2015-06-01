﻿define(function(require) {
  'use strict';

  var Dialog = require('foreground/model/dialog/dialog');
  var DialogView = require('foreground/view/dialog/dialogView');
  var SettingsView = require('foreground/view/dialog/settingsView');

  var SettingsDialogView = DialogView.extend({
    id: 'settingsDialog',

    initialize: function() {
      this.model = new Dialog({
        submitButtonText: chrome.i18n.getMessage('save')
      });

      this.contentView = new SettingsView({
        model: StreamusFG.backgroundProperties.settings,
        signInManager: StreamusFG.backgroundProperties.signInManager
      });

      DialogView.prototype.initialize.apply(this, arguments);
    },

    onSubmit: function() {
      this.contentView.save();
    }
  });

  return SettingsDialogView;
});