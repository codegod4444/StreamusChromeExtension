define(function(require) {
    'use strict';

    var VolumeAreaTemplate = require('text!template/appBar/volumeArea.html');
    var VolumeUpIconTemplate = require('text!template/icon/volumeUpIcon_24.svg');
    var VolumeDownIconTemplate = require('text!template/icon/volumeDownIcon_24.svg');
    var VolumeOffIconTemplate = require('text!template/icon/volumeOffIcon_24.svg');
    var VolumeMuteIconTemplate = require('text!template/icon/volumeMuteIcon_24.svg');

    var VolumeAreaView = Marionette.ItemView.extend({
        id: 'volumeArea',
        className: 'volumeArea',
        template: _.template(VolumeAreaTemplate),

        templateHelpers: {
            volumeUpIcon: _.template(VolumeUpIconTemplate)(),
            volumeDownIcon: _.template(VolumeDownIconTemplate)(),
            volumeOffIcon: _.template(VolumeOffIconTemplate)(),
            volumeMuteIcon: _.template(VolumeMuteIconTemplate)()
        },

        ui: function() {
            return {
                volumeProgress: '#' + this.id + '-volumeProgress',
                volumeRange: '#' + this.id + '-volumeRange',
                volumeButton: '#' + this.id + '-volumeButton',
                slidePanel: '#' + this.id + '-slidePanel',
                volumeIconUp: '#' + this.id + '-volumeIcon--up',
                volumeIconDown: '#' + this.id + '-volumeIcon--down',
                volumeIconOff: '#' + this.id + '-volumeIcon--off',
                volumeIconMute: '#' + this.id + '-volumeIcon--mute'
            };
        },

        events: {
            'input @ui.volumeRange': '_onInputVolumeRange',
            'click @ui.volumeButton': '_onClickVolumeButton',
            'wheel': '_onWheel'
        },

        player: null,

        initialize: function() {
            this.player = Streamus.backgroundPage.player;

            this.listenTo(this.player, 'change:muted', this._onPlayerChangeMuted);
            this.listenTo(this.player, 'change:volume', this._onPlayerChangeVolume);
        },

        onRender: function() {
            var volume = this.player.get('volume');
            this._setVolumeProgress(volume);

            var muted = this.player.get('muted');
            this._setVolumeIcon(volume, muted);
        },

        _onInputVolumeRange: function() {
            this._setVolume();
        },

        _onClickVolumeButton: function() {
            this._toggleMute();
        },

        _onWheel: function(event) {
            var delta = event.originalEvent.wheelDeltaY / 120;
            this._scrollVolume(delta);
        },

        _setVolume: function() {
            var volume = parseInt(this.ui.volumeRange.val());
            this.player.setVolume(volume);
        },

        _setVolumeProgress: function(volume) {
            this.ui.volumeRange.val(volume);
            this.ui.volumeProgress.height(volume + '%');
        },

        _setVolumeIcon: function(volume, muted) {
            this.ui.volumeIconUp.toggleClass('is-hidden', muted || volume <= 50);
            this.ui.volumeIconDown.toggleClass('is-hidden', muted || volume > 50 || volume === 0);
            this.ui.volumeIconOff.toggleClass('is-hidden', muted || volume !== 0);
            this.ui.volumeIconMute.toggleClass('is-hidden', !muted);
        },

        //  Adjust volume when user scrolls wheel while hovering over volume.
        _scrollVolume: function(delta) {
            var volume = parseInt(this.ui.volumeRange.val()) + (delta * 3);

            if (volume > 100) {
                volume = 100;
            }

            if (volume < 0) {
                volume = 0;
            }

            this.player.setVolume(volume);
        },

        _toggleMute: function() {
            var isMuted = this.player.get('muted');
            this.player.save({
                muted: !isMuted
            });
        },

        _onPlayerChangeVolume: function(model, volume) {
            this._setVolumeProgress(volume);
            this._setVolumeIcon(volume, model.get('muted'));
        },

        _onPlayerChangeMuted: function(model, muted) {
            this._setVolumeIcon(model.get('volume'), muted);
        }
    });

    return VolumeAreaView;
});