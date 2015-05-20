﻿define(function(require) {
    'use strict';

    var ListItemButton = require('foreground/view/behavior/listItemButton');
    var SongActions = require('foreground/model/song/songActions');
    var OptionsListItemButtonTemplate = require('text!template/listItemButton/optionsListItemButton.html');
    var OptionsIconTemplate = require('text!template/icon/optionsIcon_18.svg');

    var SongOptionsButtonView = Marionette.ItemView.extend({
        template: _.template(OptionsListItemButtonTemplate),
        templateHelpers: {
            optionsIcon: _.template(OptionsIconTemplate)()
        },

        attributes: {
            'data-tooltip-text': chrome.i18n.getMessage('moreOptions')
        },

        behaviors: {
            ListItemButton: {
                behaviorClass: ListItemButton
            }
        },

        onClick: function() {
            var offset = this.$el.offset();
            var songActions = new SongActions();
            songActions.showContextMenu(this.model, offset.top, offset.left, this.player);
        }
    });

    return SongOptionsButtonView;
});