﻿//  Holds all the relevant data for a client-side error
define([
    'settings'
], function (Settings) {
    'use strict';

    var Error = Backbone.Model.extend({
        
        defaults: {
            message: '',
            lineNumber: -1,
            url: '',
            clientVersion: chrome.app.getDetails().version,
            timeOccurred: new Date()
        },
        
        urlRoot: Settings.get('serverURL') + 'Error/'
       
    });
    
    //  Send a log message whenever any client errors occur; for debugging purposes.
    window.onerror = function (message, url, lineNumber) {

        //  Only log client errors to the database in a deploy environment, not when debugging locally.
        if (!Settings.get('localDebug')) {
            var error = new Error({
                message: message,
                url: url,
                lineNumber: lineNumber
            });

            error.save();
        }
    };

    return Error;
});