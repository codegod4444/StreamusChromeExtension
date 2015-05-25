﻿define(function(require) {
  'use strict';

  var SignInManager = require('background/model/signInManager');
  var StreamItems = require('background/collection/streamItems');
  var Search = require('background/model/search');
  var SearchView = require('foreground/view/search/searchView');
  var viewTestUtility = require('test/foreground/view/viewTestUtility');

  describe('SearchView', function() {
    beforeEach(function() {
      this.documentFragment = document.createDocumentFragment();

      this.search = new Search();
      this.searchResults = this.search.get('results');
      this.signInManager = new SignInManager();
      this.streamItems = new StreamItems();

      this.view = new SearchView({
        model: this.search,
        collection: this.searchResults,
        streamItems: this.streamItems,
        signInManager: this.signInManager
      });

      this.view.render();
    });

    viewTestUtility.ensureBasicAssumptions.call(this);

    it('should not be able to save if there are no search results and the user is not signed in', function() {
      var canSave = this.view._canSave();
      expect(canSave).to.equal(false);
    });

    it('should not be able to save if there are no search results and the user is signed in', function() {
      this.signInManager.set('signedInUser', {});
      var canSave = this.view._canSave();
      expect(canSave).to.equal(false);
    });

    it('should not be able to save if there are search results, but the user is not signed in', function() {
      this.searchResults.add({});
      var canSave = this.view._canSave();
      expect(canSave).to.equal(false);
    });

    it('should be able to save if there are search results and the user is signed in', function() {
      this.signInManager.set('signedInUser', {});
      this.searchResults.add({});
      var canSave = this.view._canSave();
      expect(canSave).to.equal(true);
    });

    describe('when clicking the saveAll button', function() {
      beforeEach(function() {
        sinon.stub(this.view, '_showSaveSelectedSimpleMenu');
      });

      afterEach(function() {
        this.view._showSaveSelectedSimpleMenu.restore();
      });

      it('should create a saveSelectedSimpleMenu when able to save', function() {
        this.signInManager.set('signedInUser', {});
        this.searchResults.add({});

        this.view._onClickSaveAllButton();
        expect(this.view._showSaveSelectedSimpleMenu.calledOnce).to.equal(true);
      });

      it('should not create a saveSelectedSimpleMenu when unable to save', function() {
        this.view._onClickSaveAllButton();
        expect(this.view._showSaveSelectedSimpleMenu.calledOnce).to.equal(false);
      });
    });

    it('should not be able to play or add if there are no search results', function() {
      var canPlayOrAdd = this.view._canPlayOrAdd();
      expect(canPlayOrAdd).to.equal(false);
    });

    it('should be able to play or add if there are search results', function() {
      this.searchResults.add({});
      var canPlayOrAdd = this.view._canPlayOrAdd();
      expect(canPlayOrAdd).to.equal(true);
    });

    describe('when clicking the addAll button', function() {
      beforeEach(function() {
        sinon.stub(this.streamItems, 'addSongs');
      });

      afterEach(function() {
        this.streamItems.addSongs.restore();
      });

      it('should add songs when able to add', function() {
        this.searchResults.add({});

        this.view._onClickAddAllButton();
        expect(this.streamItems.addSongs.calledOnce).to.equal(true);
      });

      it('should not add songs when not able to add', function() {
        this.view._onClickSaveAllButton();
        expect(this.streamItems.addSongs.calledOnce).to.equal(false);
      });
    });

    describe('when clicking the playAll button', function() {
      beforeEach(function() {
        sinon.stub(this.streamItems, 'addSongs');
      });

      afterEach(function() {
        this.streamItems.addSongs.restore();
      });

      it('should add & play songs when able to play', function() {
        this.searchResults.add({});

        this.view._onClickAddAllButton();
        expect(this.streamItems.addSongs.calledOnce).to.equal(true);
      });

      it('should not add & play songs when not able to play', function() {
        this.view._onClickSaveAllButton();
        expect(this.streamItems.addSongs.calledOnce).to.equal(false);
      });
    });
  });
});