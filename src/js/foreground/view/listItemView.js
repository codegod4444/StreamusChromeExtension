﻿define(function(require) {
  'use strict';

  var Tooltipable = require('foreground/view/behavior/tooltipable');
  var ListItemButtonsView = require('foreground/view/listItemButton/listItemButtonsView');

  var ListItemView = Marionette.LayoutView.extend({
    tagName: 'li',
    className: 'listItem listItem--clickable',

    attributes: function() {
      // Store the clientId on the view until the model has been saved successfully.
      var id = this.model.isNew() ? this.model.cid : this.model.get('id');

      return {
        'data-id': id,
        'data-type': this.options.type,
        // Children unloaded by slidingRender lose track of their parent DOM node.
        'data-parentid': this.options.parentId
      };
    },

    events: {
      'contextmenu': '_onContextMenu',
      'mouseenter': '_onMouseEnter',
      'mouseleave': '_onMouseLeave'
    },

    regions: {
      buttons: '[data-region=buttons]',
      spinner: '[data-region=spinner]',
      checkbox: '[data-region=checkbox]'
    },

    behaviors: {
      Tooltipable: {
        behaviorClass: Tooltipable
      }
    },

    _onContextMenu: function(event) {
      event.preventDefault();
      // Show the element just slightly offset as to not break onHover effects.
      this.showContextMenu(event.pageY, event.pageX + 1);
    },

    _onMouseEnter: function() {
      this.showChildView('buttons', new ListItemButtonsView({
        buttonViewOptions: this.buttonViewOptions.bind(this)
      }));
    },

    _onMouseLeave: function() {
      this.buttons.empty();
    }
  });

  return ListItemView;
});