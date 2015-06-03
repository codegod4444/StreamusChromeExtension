﻿define(function() {
  'use strict';

  var ClientError = Backbone.Model.extend({
    defaults: function() {
      return {
        instanceId: StreamusBG.instanceId,
        message: '',
        lineNumber: -1,
        url: '',
        clientVersion: chrome.runtime.getManifest().version,
        browserVersion: this._getBrowserVersion(),
        operatingSystem: '',
        architecture: '',
        stack: '',
        error: null,
        userId: ''
      };
    },

    // Don't save error because stack is a better representation of error.
    blacklist: ['error'],
    toJSON: function() {
      return this.omit(this.blacklist);
    },

    initialize: function() {
      this._cleanMessage();
      this._dropUrlPrefix();
      this._setStack();
    },

    // The first part of the message just tells me an error was thrown, no need to know that.
    _cleanMessage: function() {
      var message = this.get('message');
      var cleanMessage = message.replace('Uncaught Error: ', '').replace('Uncaught TypeError: ', '');
      this.set('message', cleanMessage);
    },

    // The first part of the URL is always the same and not very interesting. Drop it off.
    _dropUrlPrefix: function() {
      this.set('url', this.get('url').replace('chrome-extension://' + chrome.runtime.id + '/', ''));
    },

    _setStack: function() {
      var stack = '';
      var error = this.get('error');

      if (!_.isNull(error)) {
        // Guard against throw being called without an Error object.
        if (_.isUndefined(error.stack)) {
          stack = error;
        } else {
          stack = error.stack;
        }
      }

      this.set('stack', stack.replace('Error: ', '').trim());
    },

    _getBrowserVersion: function() {
      var browserVersion = '';

      var chromeMatch = navigator.appVersion.match(/Chrome\/(.*?) /);
      browserVersion += chromeMatch ? chromeMatch[0] : '';

      var operaMatch = navigator.appVersion.match(/OPR\/.*/);
      browserVersion += operaMatch ? operaMatch[0] : '';

      return browserVersion;
    }
  });

  return ClientError;
});