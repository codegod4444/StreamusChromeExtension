﻿define([
    'text!../template/radioButton.htm'
], function (RadioButtonTemplate) {
    'use strict';

    //  TODO: Consider renaming from Radio to Discovery -- sounds nicer..
    var RadioButtonView = Backbone.View.extend({
        
        tagName: 'button',

        className: 'button-icon button-small',
        
        template: _.template(RadioButtonTemplate),
        
        events: {
            'click': 'toggleRadio'
        },
        
        enabledTitle: chrome.i18n.getMessage("radioEnabled"),
        disabledTitle: chrome.i18n.getMessage("radioDisabled"),
        
        render: function () {
            console.log("Rendering");
            this.$el.html(this.template(this.model.toJSON()));

            var enabled = this.model.get('enabled');

            this.$el.toggleClass('enabled', enabled);
            
            if (enabled) {
                this.$el.attr('title', this.enabledTitle);
            } else {
                this.$el.attr('title', this.disabledTitle);
            }
            
            return this;
        },
        
        initialize: function () {
            this.listenTo(this.model, 'change:enabled', this.render);
        },
        
        toggleRadio: function () {
            console.log("Toggling radio");
            this.model.toggleRadio();
        }

    });

    return RadioButtonView;
});