﻿import {LayoutView} from 'marionette';
import Tooltipable from 'foreground/view/behavior/tooltipable';
import RadioButtonTemplate from 'template/streamControlBar/radioButton.hbs!';
import RadioIconTemplate from 'template/icon/radioIcon_18.hbs!';

var RadioButtonView = LayoutView.extend({
  id: 'radioButton',
  className: 'button button--icon button--icon--secondary button--medium',
  template: RadioButtonTemplate,
  templateHelpers: {
    radioIcon: RadioIconTemplate
  },

  attributes: {
    'data-ui': 'tooltipable'
  },

  events: {
    'click': '_onClick'
  },

  modelEvents: {
    'change:enabled': '_onChangeEnabled'
  },

  behaviors: {
    Tooltipable: {
      behaviorClass: Tooltipable
    }
  },

  onRender: function() {
    this._setState(this.model.get('enabled'), this.model.getStateMessage());
  },

  _onClick: function() {
    this.model.toggleEnabled();
  },

  _onChangeEnabled: function(model, enabled) {
    this._setState(enabled, model.getStateMessage());
  },

  _setState: function(enabled, stateMessage) {
    this.$el.toggleClass('is-enabled', enabled).attr('data-tooltip-text', stateMessage);
  }
});

export default RadioButtonView;