﻿define(function(require) {
  'use strict';

  var ListItemButton = require('foreground/model/listItemButton/listItemButton');

  var ListItemButtonsView = Marionette.ItemView.extend({
    className: 'listItem-buttons',
    template: false,
    buttonViewOptions: null,

    initialize: function(options) {
      this.buttonViewOptions = _.result(options || {}, 'buttonViewOptions');
    },

    // Render a collection of button views to keep things DRY between various types of list-items:
    onRender: function() {
      var documentFragment = document.createDocumentFragment();
      this.shownButtonViews = [];

      _.forIn(this.buttonViewOptions, function(buttonViewOption) {
        var ViewClass = buttonViewOption.viewClass;
        var options = _.omit(buttonViewOption, 'viewClass');
        var buttonView = new ViewClass(_.extend({
          model: new ListItemButton()
        }, options));

        documentFragment.appendChild(buttonView.render().el);
        buttonView.triggerMethod('show');
        this.shownButtonViews.push(buttonView);
      }, this);

      this.$el.append(documentFragment);
    },

    onBeforeDestroy: function() {
      _.each(this.shownButtonViews, function(shownButtonView) {
        shownButtonView.destroy();
      });
      this.shownButtonViews.length = 0;
    }
  });

  return ListItemButtonsView;
});