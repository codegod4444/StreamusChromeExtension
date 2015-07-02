﻿define(function(require) {
  'use strict';

  var User = require('background/model/user');

  // Wait 30 seconds before allowing signing in attempts. Prevents spamming the server with sign-in requests.
  var SIGN_IN_FAILURE_WAIT_TIME = 30;

  var SignInManager = Backbone.Model.extend({
    defaults: {
      signingIn: false,
      signInFailed: false,
      signInRetryTimer: SIGN_IN_FAILURE_WAIT_TIME,
      signInRetryTimerInterval: null,
      signingInUser: null,
      signedInUser: null,
      needLinkUserId: false,
      needGoogleSignIn: false
    },

    initialize: function() {
      this.on('change:signedInUser', this._onChangeSignedInUser);
      this.on('change:signInFailed', this._onChangeSignInFailed);
      this.listenTo(StreamusBG.channels.backgroundArea.vent, 'rendered', this._onBackgroundAreaRendered);
      this.listenTo(StreamusBG.channels.foreground.vent, 'started', this._onForegroundStarted);
      chrome.runtime.onMessage.addListener(this._onChromeRuntimeMessage.bind(this));
      chrome.runtime.onMessageExternal.addListener(this._onChromeRuntimeMessageExternal.bind(this));
      chrome.identity.onSignInChanged.addListener(this._onChromeIdentitySignInChanged.bind(this));
    },

    signInWithGoogle: function() {
      if (this._canSignIn()) {
        if (this._supportsGoogleSignIn()) {
          this._getGoogleUserInfo();
        } else {
          this._signIn();
        }
      }
    },

    signOut: function() {
      if (this.has('signedInUser')) {
        localStorage.removeItem('userId');
        this.set('signedInUser', null);
      }
    },

    saveGooglePlusId: function() {
      chrome.identity.getProfileUserInfo(function(profileUserInfo) {
        if (profileUserInfo.id === '') {
          throw new Error('saveGooglePlusId should only be called when a googlePlusId is known to exist');
        }

        var signedInUser = this.get('signedInUser');
        signedInUser.set('googlePlusId', profileUserInfo.id);
        signedInUser.hasLinkedGoogleAccount(function(hasLinkedGoogleAccount) {
          // Merge a previously known account with the existing data to prevent data loss.
          // Only happens if Streamus is used on two PCs before Chrome is signed in.
          if (hasLinkedGoogleAccount) {
            signedInUser.mergeByGooglePlusId();
          } else {
            // Otherwise, no account -- safe to patch in a save and use this account as the main one.
            signedInUser.save({googlePlusId: profileUserInfo.id}, {patch: true});
          }
        }.bind(this));
      }.bind(this));

      this.set('needLinkUserId', false);
    },

    _onBackgroundAreaRendered: function() {
      this.signInWithGoogle();
    },

    _onForegroundStarted: function() {
      if (this._canSignIn()) {
        this.signInWithGoogle();
      }
    },

    _signIn: function(googlePlusId) {
      this.set('signingIn', true);

      var signingInUser = new User({
        googlePlusId: googlePlusId || ''
      });

      this.set('signingInUser', signingInUser);

      if (this._supportsGoogleSignIn() && !signingInUser.linkedToGoogle()) {
        this._needGoogleSignIn();
      } else {
        // If the user signs out and then signs back in without restarting Streamus then shouldn't promtp them to sign in.
        this.set('needGoogleSignIn', false);
      }

      this.listenTo(signingInUser, 'loadSuccess', this._onSignInSuccess.bind(this, signingInUser));
      this.listenTo(signingInUser, 'loadError', this._onSignInError.bind(this, signingInUser));

      // If the account doesn't have a Google+ ID -- try logging in by localStorage ID.
      if (!signingInUser.linkedToGoogle()) {
        signingInUser.tryloadByUserId();
      } else {
        // If the account does have a Google+ ID -- the account might be known to the database or it might not, check.
        signingInUser.hasLinkedGoogleAccount(function(hasLinkedGoogleAccount) {
          // If the account is known to the database -- load it.
          if (hasLinkedGoogleAccount) {
            signingInUser.loadByGooglePlusId();
          } else {
            // Otherwise, consider the fact that there might be existing account data which could be lost if sign-in occurs.
            var signedInUser = this.get('signedInUser');

            // If the signed in account is not linked to Google then information will be lost if the user account is loaded.
            // So, mark that user data needs to be linked instead of overwriting.
            if (!_.isNull(signedInUser) && !signedInUser.linkedToGoogle()) {
              this._setSignedInUser(signedInUser);
            } else {
              // If user already linked to Google then it is OK to swap data because no information will be lost.
              signingInUser.tryloadByUserId();
            }
          }
        }.bind(this));
      }
    },

    // getProfileUserInfo is only supported in Chrome v37 for Win/Macs currently.
    _supportsGoogleSignIn: function() {
      // chrome.identity.getProfileUserInfo is defined in Opera, but throws an error if called. I've reported the issue to them.
      var isOpera = navigator.userAgent.indexOf(' OPR/') >= 0;
      return !_.isUndefined(chrome.identity.getProfileUserInfo) && !isOpera;
    },

    _getGoogleUserInfo: function() {
      chrome.identity.getProfileUserInfo(this._onGetProfileUserInfo.bind(this));
    },

    // https://developer.chrome.com/extensions/identity#method-getProfileUserInfo
    _onGetProfileUserInfo: function(profileUserInfo) {
      this._signIn(profileUserInfo.id);
    },

    _onChangeSignedInUser: function(model, signedInUser) {
      // Send a message to open YouTube tabs that Streamus has signed in and their HTML needs to update.
      StreamusBG.channels.tab.commands.trigger('notify:youTube', {
        event: _.isNull(signedInUser) ? 'signed-out' : 'signed-in'
      });
    },

    _onChangeSignInFailed: function(model, signInFailed) {
      if (signInFailed) {
        this._onSignInFailed();
      }
    },

    _onSignInFailed: function() {
      clearInterval(this.get('signInRetryInterval'));
      this.set('signInRetryInterval', setInterval(this._doSignInRetryTimerIntervalTick.bind(this), 1000));
    },

    _doSignInRetryTimerIntervalTick: function() {
      var signInRetryTimer = this.get('signInRetryTimer');
      this.set('signInRetryTimer', signInRetryTimer - 1);

      if (signInRetryTimer === 1) {
        this._resetSignInRetryTimer();
      }
    },

    _resetSignInRetryTimer: function() {
      clearInterval(this.get('signInRetryInterval'));
      this.set('signInRetryTimer', SIGN_IN_FAILURE_WAIT_TIME);
      this.set('signInFailed', false);
    },

    // Returns false if the sign-in process is in progress or a user is already signed in.
    _canSignIn: function() {
      var signedInUser = this.get('signedInUser');
      var canSignIn = _.isNull(signedInUser) && !this.get('signingIn') && !this.get('signInFailed');
      return canSignIn;
    },

    // https://developer.chrome.com/extensions/identity#event-onSignInChanged
    _onChromeIdentitySignInChanged: function(account, signedIn) {
      if (signedIn) {
        this._signIn(account.id);
      } else {
        this._onChromeSignedOut(account.id);
      }
    },

    _onSignInSuccess: function(signingInUser) {
      this._setSignedInUser(signingInUser);
    },

    _onSignInError: function(signingInUser, error) {
      this.stopListening(signingInUser);
      this.set('signingInUser', null);

      console.error(error);
      this.set('signingIn', false);
      this.set('signInFailed', true);
    },

    _setSignedInUser: function(signingInUser) {
      this.stopListening(signingInUser);

      this.set('signedInUser', signingInUser);
      this.set('signingInUser', null);

      // Announce that user has signedIn so managers can use it to fetch data.
      this.set('signingIn', false);

      this._shouldLinkUserId(function(shouldLinkUserId) {
        if (shouldLinkUserId) {
          this._needLinkUserId();
        }
      }.bind(this));
    },

    // When the active Chrome user signs out, check to see if it's linked to the current Streamus user.
    // If so, unload the current Streamus user and re-create as a non-chrome user.
    _onChromeSignedOut: function(googlePlusId) {
      if (googlePlusId === this.get('signedInUser').get('googlePlusId')) {
        this.signOut();
        this.signInWithGoogle();
      }
    },

    _onChromeRuntimeMessage: function(request, sender, sendResponse) {
      switch (request.method) {
        case 'getSignedInState':
          sendResponse({
            signedIn: this.has('signedInUser')
          });
          break;
        case 'signIn':
          this.signInWithGoogle();
          break;
      }
    },

    _onChromeRuntimeMessageExternal: function(request, sender, sendResponse) {
      var sendAsynchronousResponse = false;

      switch (request.method) {
        case 'copyPlaylist':
          if (this._canSignIn()) {
            var onSignInSuccess = function() {
              this._handleCopyPlaylistRequest(request, sendResponse);
              this.off('change:signInFailed', onSignInFailed);
            };

            var onSignInFailed = function() {
              this.off('change:signedInUser', onSignInSuccess);
              sendResponse({
                result: 'error',
                error: 'Failed to sign in'
              });
            };

            this.once('change:signedInUser', onSignInSuccess);
            this.once('change:signInFailed', onSignInFailed);

            this.signInWithGoogle();
          } else {
            this._handleCopyPlaylistRequest(request, sendResponse);
          }

          sendAsynchronousResponse = true;
          break;
        case 'isUserLoaded':
          sendResponse({
            isUserLoaded: this.has('signedInUser')
          });
          break;
      }

      // sendResponse becomes invalid after returning you return true to indicate a response will be sent asynchronously.
      return sendAsynchronousResponse;
    },

    _handleCopyPlaylistRequest: function(request, sendResponse) {
      // It would be nice to handle this at a lower level, but I need the ability to sign a user in first.
      this.get('signedInUser').get('playlists').copyPlaylist({
        playlistId: request.playlistId,
        success: function() {
          sendResponse({
            result: 'success'
          });
        },
        error: function(error) {
          sendResponse({
            result: 'error',
            error: error
          });
        }
      });
    },

    _shouldLinkUserId: function(callback) {
      if (this._supportsGoogleSignIn()) {
        chrome.identity.getProfileUserInfo(function(profileUserInfo) {
          var signedInToChrome = profileUserInfo.id !== '';
          var accountLinked = this.get('signedInUser').linkedToGoogle();
          callback(signedInToChrome && !accountLinked);
        }.bind(this));
      } else {
        callback(false);
      }
    },

    _needLinkUserId: function() {
      this.set('needLinkUserId', true);
    },

    _needGoogleSignIn: function() {
      this.set('needGoogleSignIn', true);
    }
  });

  return SignInManager;
});