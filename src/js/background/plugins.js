﻿define(function(require) {
    'use strict';

    require('backbone.marionette');
    require('backbone.localStorage');

    var Cocktail = require('cocktail');
    Cocktail.patch(Backbone);

    //  TODO: I really feel like I should be able to mix this in from the background page, but it throws errors. Need to debug at some point. Probably very scary..
    //var lodashMixin = require('common/lodashMixin');
    //_.mixin(lodashMixin);

    //  Some sensitive data is not committed to GitHub. Use an example file to help others and provide detection of incomplete setup.
    requirejs.onError = function(error) {
        var headerWritten = false;
        console.error('error:', error);

        error.requireModules.forEach(function(requireModule) {
            if (requireModule.indexOf('background/key/') !== -1) {
                if (!headerWritten) {
                    console.warn('%c ATTENTION! Additional configuration is required', 'color: rgb(66,133,244); font-size: 18px; font-weight: bold;');
                    console.warn('%c -----------------------------------------------', 'color: rgb(66,133,244); font-size: 18px; font-weight: bold;');
                    headerWritten = true;
                }

                console.warn('%cKey not found. \n Rename "' + requireModule + '.js.example" to "' + requireModule + '.js".\n Then, follow the instructions in the file.', 'color: red');
            }
        });

        if (headerWritten) {
            console.warn('%c -----------------------------------------------', 'color: rgb(66,133,244); font-size: 18px; font-weight: bold;');
        }
    };

    //  Finally, load the application:
    require(['background/application']);
});