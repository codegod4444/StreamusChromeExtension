﻿define([
    'foreground/model/foregroundViewManager',
    'text!template/editPlaylist.html'
], function (ForegroundViewManager, EditPlaylistTemplate) {
    'use strict';

    var EditPlaylistView = Backbone.Marionette.ItemView.extend({

        className: 'editPlaylist',

        template: _.template(EditPlaylistTemplate),
        
        ui: {
            playlistTitle: 'input[type="text"]'
        },
        
        events: {
            'input input.playlistTitle': 'validateTitle'
        },
        
        templateHelpers: {
            requiredMessage: chrome.i18n.getMessage('required'),
            titleMessage: chrome.i18n.getMessage('title').toLowerCase()
        },
        
        onRender: function () {
            //  Reset val to prevent highlighting and just focus.
            this.ui.playlistTitle.focus().val(this.ui.playlistTitle.val());
        },
        
        initialize: function() {
            ForegroundViewManager.subscribe(this);
        },
        
        validateTitle: function () {
            //  When the user submits - check to see if they provided a playlist name
            var playlistTitle = $.trim(this.ui.playlistTitle.val());
            this.ui.playlistTitle.toggleClass('invalid', playlistTitle === '');
        },

        validate: function() {
            var valid = this.$el.find('.submittable.invalid').length === 0;
            return valid;
        },
        
        doOk: function () {
            var playlistTitle = $.trim(this.ui.playlistTitle.val());
            this.model.set('title', playlistTitle);
        }

    });

    return EditPlaylistView;
});