﻿define(function(require) {
  'use strict';

  var ActivePaneFilterView = require('foreground/view/appBar/activePaneFilterView');
  var ActivePaneFilter = require('foreground/model/appBar/activePaneFilter');
  var SignInManager = require('background/model/signInManager');
  var ActivePlaylistManager = require('background/model/activePlaylistManager');
  var viewTestUtility = require('test/foreground/view/viewTestUtility');

  describe('ActivePaneFilterView', function() {
    beforeEach(function() {
      this.documentFragment = document.createDocumentFragment();
      this.view = new ActivePaneFilterView({
        model: new ActivePaneFilter({
          signInManager: new SignInManager(),
          activePlaylistManager: new ActivePlaylistManager({
            signInManager: new SignInManager()
          })
        })
      });
    });

    afterEach(function() {
      if (!this.view.isDestroyed) {
        this.view.destroy();
      }
    });

    viewTestUtility.ensureBasicAssumptions.call(this);

    it('should clean-up its models event handlers when destroyed', function() {
      expect(!_.isEmpty(this.view.model._listeningTo));
      this.view.destroy();
      expect(_.isEmpty(this.view.model._listeningTo));
    });

    describe('when clicked', function() {
      beforeEach(function() {
        this.view.render();
      });

      it('should do nothing if disabled', function() {
        this.view.model.set('isEnabled', false);
        sinon.stub(this.view, '_showPaneFilterMenu');
        this.view._onClick();
        expect(this.view._showPaneFilterMenu.calledOnce).to.equal(false);
        this.view._showPaneFilterMenu.restore();
      });

      it('should call _showPaneFilterMenu if enabled', function() {
        this.view.model.set('isEnabled', true);
        sinon.stub(this.view, '_showPaneFilterMenu');
        this.view._onClick();
        expect(this.view._showPaneFilterMenu.calledOnce).to.equal(true);
        this.view._showPaneFilterMenu.restore();
      });
    });

    describe('_deactivateActivePlaylist', function() {
      it('should not throw an error if there is no active playlist', function() {
        this.view.model.get('activePlaylistManager').set('activePlaylist', null);
        this.view._deactivateActivePlaylist();
      });
    });
  });
});