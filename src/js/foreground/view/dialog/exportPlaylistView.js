﻿define(function(require) {
  'use strict';

  var Utility = require('common/utility');
  var ExportFileType = require('common/enum/exportFileType');
  var RadioGroups = require('foreground/collection/element/radioGroups');
  var RadioGroupView = require('foreground/view/element/radioGroupView');
  var DialogContent = require('foreground/view/behavior/dialogContent');
  var ExportPlaylistTemplate = require('text!template/dialog/exportPlaylist.html');

  var ExportPlaylistView = Marionette.LayoutView.extend({
    id: 'exportPlaylist',
    template: _.template(ExportPlaylistTemplate),

    templateHelpers: {
      fileTypeMessage: chrome.i18n.getMessage('fileType'),
      csvMessage: chrome.i18n.getMessage('csv'),
      jsonMessage: chrome.i18n.getMessage('json')
    },

    regions: {
      fileType: '[data-region=fileType]'
    },

    behaviors: {
      DialogContent: {
        behaviorClass: DialogContent
      }
    },

    radioGroups: null,

    initialize: function() {
      this.radioGroups = new RadioGroups();
    },

    onRender: function() {
      this._showRadioGroup('fileType', ExportFileType);
    },

    saveAndExport: function() {
      this._save();
      this._export();
    },

    _showRadioGroup: function(propertyName, options) {
      var buttons = _.map(options, function(value, key) {
        return {
          checked: this.model.get(propertyName) === value,
          value: value,
          labelText: chrome.i18n.getMessage(key)
        };
      }, this);

      var radioGroup = this.radioGroups.add({
        property: propertyName,
        buttons: buttons
      });

      this.showChildView(propertyName, new RadioGroupView({
        model: radioGroup,
        collection: radioGroup.get('buttons')
      }));
    },

    _save: function() {
      var currentValues = {};

      this.radioGroups.each(function(radioGroup) {
        currentValues[radioGroup.get('property')] = radioGroup.get('buttons').getChecked().get('value');
      });

      this.model.save(currentValues);
    },

    _export: function() {
      var downloadableElement = document.createElement('a');

      var mimeType = this._getMimeType();
      var encodedFileText = encodeURIComponent(this._getFileText());
      downloadableElement.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodedFileText);

      var fileName = this._getFileName();
      downloadableElement.setAttribute('download', fileName);
      downloadableElement.click();

      StreamusFG.channels.notification.commands.trigger('show:notification', {
        message: chrome.i18n.getMessage('playlistExported')
      });
    },

    _getFileText: function() {
      var itemsToExport = this.model.get('playlist').get('items').map(this._mapAsExportedItem.bind(this));
      var json = JSON.stringify(itemsToExport);
      var fileText;

      if (this._isExportingAsCsv()) {
        fileText = Utility.jsonToCsv(json);
      } else {
        fileText = json;
      }

      return fileText;
    },

    _mapAsExportedItem: function(item) {
      var song = item.get('song');

      var exportedItem = {
        title: song.get('title'),
        id: song.get('id'),
        url: song.get('url'),
        author: song.get('author'),
        duration: song.get('duration'),
        prettyDuration: song.get('prettyDuration')
      };

      return exportedItem;
    },

    _getFileName: function() {
      var fileName = this.model.get('playlist').get('title');
      fileName += this._isExportingAsJson() ? '.json' : '.txt';
      return fileName;
    },

    _getMimeType: function() {
      return this._isExportingAsJson() ? 'application/json' : 'text/plain';
    },

    _isExportingAsJson: function() {
      return this.radioGroups.getByProperty('fileType').getCheckedValue() === ExportFileType.Json;
    },

    _isExportingAsCsv: function() {
      return this.radioGroups.getByProperty('fileType').getCheckedValue() === ExportFileType.Csv;
    }
  });

  return ExportPlaylistView;
});