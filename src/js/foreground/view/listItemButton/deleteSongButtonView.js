﻿define([
    'foreground/view/listItemButton/listItemButtonView',
    'text!template/listItemButton/deleteListItemButton.html'
], function (ListItemButtonView, DeleteListItemButtonTemplate) {
    'use strict';

    var DeleteSongButtonView = ListItemButtonView.extend({
        template: _.template(DeleteListItemButtonTemplate),
        
        attributes: {
            title: chrome.i18n.getMessage('delete')
        },
        
        doOnClickAction: function () {
            this.model.destroy();
        }
    });

    return DeleteSongButtonView;
});