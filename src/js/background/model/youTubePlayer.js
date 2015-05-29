﻿define(function(require) {
  'use strict';

  var YouTubePlayerAPI = require('background/model/youTubePlayerAPI');
  var YouTubePlayerError = require('common/enum/youTubePlayerError');
  var YouTubePlayerState = require('background/enum/youTubePlayerState');

  // This is the actual YouTube Player API widget housed within the iframe.
  var youTubePlayerWidget = null;

  // This value is 1 because it is displayed visually.
  // 'Load attempt: 0' does not make sense to non-programmers.
  var _initialLoadAttempt = 1;

  var YouTubePlayer = Backbone.Model.extend({
    defaults: function() {
      return {
        ready: false,
        loading: false,
        api: new YouTubePlayerAPI(),
        iframeId: '',
        // Wait 6 seconds before each load attempt so that total time elapsed is one minute
        maxLoadAttempts: 10,
        loadAttemptDelay: 6000,
        currentLoadAttempt: _initialLoadAttempt,
        loadAttemptInterval: null,
        pauseOnBuffer: false
      };
    },

    initialize: function() {
      this.listenTo(this.get('api'), 'change:ready', this._onApiChangeReady);
      this.listenTo(StreamusBG.channels.foreground.vent, 'started', this._onForegroundStarted);
      this.on('change:loading', this._onChangeLoading);
    },

    // Preload is used to indicate that an attempt to load YouTube's API is expected soon.
    // If YouTube's iframe fails to load then load will not be called.
    // If the iframe does load successfully then load will be called.
    preload: function() {
      if (!this.get('loading')) {
        // Ensure the widget is null for debugging purposes.
        // Being able to tell if the widget's method failed vs widget itself not being ready is important.
        youTubePlayerWidget = null;
        // Set loading after ready because having the player be both 'loading' and 'ready' does not make sense.
        this.set('ready', false);
        this.set('loading', true);
      }
    },

    // Loading a widget requires the widget's API be ready first. Ensure that the API is loaded
    // otherwise defer loading a widget until the API is ready.
    load: function() {
      var api = this.get('api');

      if (api.get('ready')) {
        this._loadWidget();
      } else {
        api.load();
      }
    },

    stop: function() {
      youTubePlayerWidget.stopVideo();
    },

    pause: function() {
      youTubePlayerWidget.pauseVideo();
    },

    play: function() {
      youTubePlayerWidget.playVideo();
    },

    seekTo: function(timeInSeconds) {
      // Always pass allowSeekAhead: true to the seekTo method.
      // If this value is not provided and the user seeks to the end of a song while paused
      // the player will enter into a bad state of 'ended -> playing.'
      // https://developers.google.com/youtube/js_api_reference#seekTo
      youTubePlayerWidget.seekTo(timeInSeconds, true);
    },

    setMuted: function(muted) {
      if (muted) {
        youTubePlayerWidget.mute();
      } else {
        youTubePlayerWidget.unMute();
      }
    },

    setVolume: function(volume) {
      youTubePlayerWidget.setVolume(volume);
    },

    // The variable is called suggestedQuality because the widget may not have be able to fulfill the request.
    // If it cannot, it will set its quality to the level most near suggested quality.
    setPlaybackQuality: function(suggestedQuality) {
      youTubePlayerWidget.setPlaybackQuality(suggestedQuality);
    },

    loadVideoById: function(videoOptions) {
      youTubePlayerWidget.loadVideoById(videoOptions);
    },

    cueVideoById: function(videoOptions) {
      // Avoid using cueVideoById because it will set the player's state to 'SongCued'
      // 'SongCued' is similar to 'paused' but causes 'seekTo' to begin playback immediately.
      // There's no advantage to the SongCued state and has obvious drawbacks; avoid it.
      this.set('pauseOnBuffer', true);
      youTubePlayerWidget.loadVideoById(videoOptions);
      // Try to pause as quickly as possible, but this is timing dependent. So, guard with pauseOnBuffer flag.
      _.defer(this.pause.bind(this));
    },

    _loadWidget: function() {
      // YouTube's API creates the window.YT object with which widgets can be created.
      // https://developers.google.com/youtube/iframe_api_reference#Loading_a_Video_Player
      youTubePlayerWidget = new window.YT.Player(this.get('iframeId'), {
        events: {
          onReady: this._onYouTubePlayerReady.bind(this),
          onStateChange: this._onYouTubePlayerStateChange.bind(this),
          onError: this._onYouTubePlayerError.bind(this)
        }
      });
    },

    _onYouTubePlayerReady: function() {
      // Set ready to true before setting loading to false otherwise it looks like youTubePlayer failed to load properly.
      this.set('ready', true);
      this.set('loading', false);
    },

    _onYouTubePlayerStateChange: function(event) {
      if (this.get('pauseOnBuffer') && event.data === YouTubePlayerState.Buffering) {
        this.set('pauseOnBuffer', false);
        this.pause();
      }

      // Pass 'this' as the first parameter to match the event signature of a Backbone.Model change event.
      this.trigger('change:state', this, event.data);
    },

    // Emit errors so the foreground so can notify the user.
    _onYouTubePlayerError: function(error) {
      // YouTube's API emits a 'ReallyBad' error due to content restrictions, but only because Referer
      // has been modified. The API would normally emit a 'NoPlayEmbedded2' error.
      // 'ReallyBad' might also mean that the user's Internet went out.
      // Try to recover from an Internet outage by reloading the API.
      if (error.data === YouTubePlayerError.ReallyBad) {
        this.preload();
      } else {
        this.trigger('youTubeError', this, error.data);
      }
    },

    _onApiChangeReady: function(model, ready) {
      if (ready) {
        this._loadWidget();
      }
    },

    _onChangeLoading: function(model, loading) {
      this.set('currentLoadAttempt', _initialLoadAttempt);
      var loadAttemptInterval = null;

      // Consume an attempt every 6 seconds while loading.
      if (loading) {
        loadAttemptInterval = setInterval(this._onLoadAttemptDelayExceeded.bind(this), this.get('loadAttemptDelay'));
      } else {
        clearInterval(this.get('loadAttemptInterval'));
      }

      this.set('loadAttemptInterval', loadAttemptInterval);
    },

    _onLoadAttemptDelayExceeded: function() {
      var currentLoadAttempt = this.get('currentLoadAttempt');

      if (currentLoadAttempt === this.get('maxLoadAttempts')) {
        this.set('loading', false);
      } else {
        this.set('currentLoadAttempt', currentLoadAttempt + 1);
      }
    },

    // Streamus could have disconnected from the API and failed to recover automatically.
    // A good time to try recovering again is when the user is interacting the UI.
    _onForegroundStarted: function() {
      if (!this.get('ready')) {
        this.preload();
      }
    }
  });

  return YouTubePlayer;
});