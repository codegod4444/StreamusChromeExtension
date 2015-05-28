﻿define(function(require) {
  'use strict';

  var TooltipView = require('foreground/view/tooltip/tooltipView');
  var Tooltip = require('foreground/model/tooltip/tooltip');
  var utility = require('common/utility');

  var TooltipRegion = Marionette.Region.extend({
    initialize: function() {
      this.listenTo(StreamusFG.channels.tooltip.commands, 'show:tooltip', this._showTooltip);
      this.listenTo(StreamusFG.channels.tooltip.commands, 'hide:tooltip', this._hideTooltip);
      this.listenTo(StreamusFG.channels.tooltip.commands, 'update:tooltip', this._updateTooltip);
    },

    _showTooltip: function(options) {
      this.show(new TooltipView({
        model: new Tooltip({
          text: options.text
        })
      }));

      // Let the DOM update so that offsetWidth and offsetHeight return correct values
      requestAnimationFrame(this._setTooltipViewOffset.bind(this, this.currentView, options.targetBoundingClientRect));
    },

    _hideTooltip: function() {
      if (this.hasView()) {
        this.currentView.hide();
      }
    },

    _updateTooltip: function(options) {
      if (this.hasView()) {
        this.currentView.model.set('text', options.text);
        this._setTooltipViewOffset(this.currentView, options.targetBoundingClientRect);
      }
    },

    _setTooltipViewOffset: function(tooltipView, boundingClientRect) {
      var tooltipWidth = tooltipView.el.offsetWidth;
      var tooltipHeight = tooltipView.el.offsetHeight;

      // Figure out the desired offset of the tooltip based on its dimensions, location, and the dimensions of its target
      var offset = this._getAdjustedOffset(boundingClientRect, tooltipWidth, tooltipHeight);
      tooltipView.showAtOffset(offset);
    },

    // Perform math in an attempt to center the tooltip along the bottom of a given element.
    // If it can't go along the bottom then flip it and place it along the top.
    // If it can't fit in the center then shift it to the left or right until it fits.
    _getAdjustedOffset: function(boundingClientRect, tooltipWidth, tooltipHeight) {
      // adjustY is a feel good value for how far below the target the tooltip should be offset.
      var adjustY = 8;
      var targetHeight = boundingClientRect.height;
      var targetWidth = boundingClientRect.width;
      var offsetTop = boundingClientRect.top + targetHeight + adjustY;
      var offsetLeft = boundingClientRect.left + targetWidth / 2 - tooltipWidth / 2;

      var adjustedLeftOffset = utility.shiftOffset(offsetLeft, tooltipWidth, window.innerWidth);
      // Double adjust to counter-act the fact that it has already been added once to offsetTop.
      var adjustedTopOffset = utility.flipInvertOffset(offsetTop, tooltipHeight, window.innerHeight, targetHeight, adjustY * 2);

      var adjustedOffset = {
        // Be sure to round the values because sub-pixel positioning of a tooltip can cause blur.
        top: Math.round(adjustedTopOffset),
        left: Math.round(adjustedLeftOffset)
      };

      return adjustedOffset;
    }
  });

  return TooltipRegion;
});