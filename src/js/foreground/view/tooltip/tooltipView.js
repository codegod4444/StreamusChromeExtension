﻿define(function(require) {
  'use strict';

  var TooltipTemplate = require('text!template/tooltip/tooltip.html');

  var TooltipView = Marionette.ItemView.extend({
    className: 'tooltip panel',
    template: _.template(TooltipTemplate),

    ui: {
      panelContent: '[data-ui~=panelContent]'
    },

    modelEvents: {
      'change:text': '_onChangeText'
    },

    // Move the tooltip's location to a spot on the page and fade it in
    showAtOffset: function(offset) {
      this.$el.css('transform', 'translate(' + offset.left + 'px, ' + offset.top + 'px)');
      this.$el.addClass('is-visible');
    },

    // Fade out the tooltip and then destroy it once completely hidden
    hide: function() {
      if (this.isRendered) {
        this.ui.panelContent.one('webkitTransitionEnd', this._onTransitionOutComplete.bind(this));
        this.$el.removeClass('is-visible');
      } else {
        this.destroy();
      }
    },

    _onChangeText: function(model, text) {
      this.ui.panelContent.text(text);
    },

    _onTransitionOutComplete: function() {
      this.destroy();
    }
  });

  return TooltipView;
});