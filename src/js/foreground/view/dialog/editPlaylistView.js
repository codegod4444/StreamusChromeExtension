﻿define(function(require) {
  'use strict';

  var DialogContent = require('foreground/view/behavior/dialogContent');
  var EditPlaylistTemplate = require('text!template/dialog/editPlaylist.html');

  var EditPlaylistView = Marionette.LayoutView.extend({
    id: 'editPlaylist',
    template: _.template(EditPlaylistTemplate),
    titleMaxLength: 150,

    templateHelpers: function() {
      return {
        titleMessage: chrome.i18n.getMessage('title'),
        titleMaxLength: this.titleMaxLength
      };
    },

    ui: {
      title: '[data-ui~=title]',
      titleCharacterCount: '[data-ui~=title-characterCount]'
    },

    events: {
      'input @ui.title': '_onInputTitle'
    },

    behaviors: {
      DialogContent: {
        behaviorClass: DialogContent
      }
    },

    onRender: function() {
      this._setTitleCharacterCount();
    },

    onAttach: function() {
      // Reset val to prevent text from becoming highlighted.
      this.ui.title.focus().val(this.ui.title.val());
    },

    onValidationFailed: function() {
      this.ui.title.focus();
    },

    editPlaylist: function() {
      var trimmedTitle = this._getTrimmedTitle();
      this.model.get('playlist').set('title', trimmedTitle);
    },

    _setTitleCharacterCount: function() {
      var trimmedTitle = this._getTrimmedTitle();
      this.ui.titleCharacterCount.text(trimmedTitle.length);
    },

    _onInputTitle: function() {
      this._setTitleCharacterCount();
      this._validateTitle();
    },

    _validateTitle: function() {
      // When the user submits - check to see if they provided a playlist name
      var trimmedTitle = this._getTrimmedTitle();
      var isValid = trimmedTitle !== '';
      this.ui.title.toggleClass('is-invalid', !isValid);
      this.model.set('valid', isValid);
    },

    _getTrimmedTitle: function() {
      return this.ui.title.val().trim();
    }
  });

  return EditPlaylistView;
});