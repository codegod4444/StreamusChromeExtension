﻿define([
    'foreground/view/behavior/behaviors'
], function (Behaviors) {
    'use strict';
    
    var Application = new Backbone.Marionette.Application();

    Application.addInitializer(function() {
        Backbone.Marionette.Behaviors.behaviorsLookup = function () {
            return Behaviors;
        };
    });
    
    Application.on('initialize:after', function () {
        //  Fire up the foreground:
        require(['foreground/foreground']);
    });

    Application.start();

    //  Expose Application globally for referencing EventAggregator, etc. without incurring circular reference in requireJS.
    window.Application = Application;
});