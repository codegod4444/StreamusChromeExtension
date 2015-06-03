﻿define(function(require) {
  'use strict';

  var ClearStreamDialogView = require('foreground/view/dialog/clearStreamDialogView');
  var StreamItems = require('background/collection/streamItems');
  var viewTestUtility = require('test/foreground/view/viewTestUtility');

  describe('ClearStreamDialogView', function() {
    beforeEach(function() {
      this.streamItems = new StreamItems();

      this.documentFragment = document.createDocumentFragment();
      this.view = new ClearStreamDialogView({
        streamItems: this.streamItems
      });
    });

    afterEach(function() {
      this.view.destroy();
    });

    viewTestUtility.ensureBasicAssumptions.call(this);

    describe('onSubmit', function() {
      it('should clear StreamItems', function() {
        sinon.stub(this.streamItems, 'clear');

        this.view.onSubmit();
        expect(this.streamItems.clear.calledOnce).to.equal(true);

        this.streamItems.clear.restore();
      });
    });
  });
});