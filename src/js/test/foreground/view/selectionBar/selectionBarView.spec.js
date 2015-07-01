﻿define(function(require) {
  'use strict';

  var SelectionBarView = require('foreground/view/selectionBar/selectionBarView');
  var SelectionBar = require('foreground/model/selectionBar/selectionBar');
  var StreamItems = require('background/collection/streamItems');
  var SearchResults = require('background/collection/searchResults');
  var SignInManager = require('background/model/signInManager');
  var ActivePlaylistManager = require('background/model/activePlaylistManager');
  var viewTestUtility = require('test/foreground/view/viewTestUtility');

  describe('SelectionBarView', function() {
    beforeEach(function() {
      this.documentFragment = document.createDocumentFragment();
      this.view = new SelectionBarView({
        model: new SelectionBar({
          streamItems: new StreamItems(),
          searchResults: new SearchResults(),
          signInManager: new SignInManager(),
          activePlaylistManager: new ActivePlaylistManager({
            signInManager: new SignInManager()
          })
        })
      });
    });

    afterEach(function() {
      this.view.destroy();
    });

    viewTestUtility.ensureBasicAssumptions.call(this);
  });
});