﻿define({
    //  Takes a time in seconds and converts it to something human-readable in the format of H:mm:ss or mm:ss.
    prettyPrintTime: function(timeInSeconds) {
        if (isNaN(timeInSeconds)) {
            timeInSeconds = 0;
        }

        var hours = Math.floor(timeInSeconds / 3600);
        var remainingSeconds = timeInSeconds % 3600;

        var minutes = Math.floor(remainingSeconds / 60);
        remainingSeconds = remainingSeconds % 60;

        //  Ensure two-digits for small numbers
        if (minutes < 10) {
            minutes = '0' + minutes;
        }

        if (remainingSeconds < 10) {
            remainingSeconds = '0' + remainingSeconds;
        }

        var timeString = minutes + ':' + remainingSeconds;

        if (hours > 0) {
            timeString = hours + ':' + timeString;
        }

        return timeString;
    },

    //  Similar to prettyPrintTime, but incorporates "days" "hours" "minutes" into the end result instead of just using numbers.
    prettyPrintTimeWithWords: function(timeInSeconds) {
        var prettyTime;
        var timeInMinutes = Math.floor(timeInSeconds / 60);

        //  Print the total duration of content in minutes unless there is 3+ hours, then just print hours.
        if (timeInMinutes === 1) {
            prettyTime = timeInMinutes + ' ' + chrome.i18n.getMessage('minute');
        }
            //  3 days
        else if (timeInMinutes > 4320) {
            prettyTime = Math.floor(timeInMinutes / 1440) + ' ' + chrome.i18n.getMessage('days');
        }
            //  3 hours
        else if (timeInMinutes > 180) {
            prettyTime = Math.floor(timeInMinutes / 60) + ' ' + chrome.i18n.getMessage('hours');
        } else {
            prettyTime = timeInMinutes + ' ' + chrome.i18n.getMessage('minutes');
        }

        return prettyTime;
    },

    //  Inspired by the Chrome Last.fm Scrobbler extension by David Sabata (https://github.com/david-sabata/Chrome-Last.fm-Scrobbler)
    cleanTitle: function(title) {
        title = title.trim();
        title = title.replace(/\s*\*+\s?\S+\s?\*+$/, ''); // **NEW**
        title = title.replace(/\s*\[[^\]]+\]$/, ''); // [whatever]
        title = title.replace(/\s*\([^\)]*version\)$/i, ''); // (whatever version)
        title = title.replace(/\s*\.(avi|wmv|mpg|mpeg|flv)$/i, ''); // video extensions
        title = title.replace(/\s*video\s*clip/i, ''); // video clip
        title = title.replace(/\s*(of+icial\s*)?(music\s*)?video/i, ''); // (official)? (music)? video
        title = title.replace(/\s*(ALBUM TRACK\s*)?(album track\s*)/i, ''); // (ALBUM TRACK)
        title = title.replace(/\s*\(\s*of+icial\s*\)/i, ''); // (official)
        title = title.replace(/\s*\(\s*[0-9]{4}\s*\)/i, ''); // (1999)
        title = title.replace(/\s+\(\s*(HD|HQ)\s*\)$/, ''); // HD (HQ)
        title = title.replace(/\s+(HD|HQ)\s*$/, ''); // HD (HQ)
        title = title.replace(/\s+\(?live\)?$/i, ''); // live
        title = title.replace(/\(\s*\)/, ''); // Leftovers after e.g. (official video)
        title = title.replace(/\(.*lyrics?\)/i, ''); // (with lyrics)
        title = title.replace(/\s*with\s+lyrics?\s*$/i, ''); // with lyrics
        title = title.replace(/^(|.*\s)"(.*)"(\s.*|)$/, '$2'); // Artist - The new "Track title" featuring someone
        title = title.replace(/^(|.*\s)'(.*)'(\s.*|)$/, '$2'); // 'Track title'
        title = title.replace(/^[\/\s,:;~-\s"]+/, ''); // trim starting white chars and dash
        title = title.replace(/[\/\s,:;~-\s"\s!]+$/, ''); // trim trailing white chars and dash 

        return title;
    },

    //  http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    escapeRegExp: function(string) {
        var escapedString = string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
        return escapedString;
    },

    //  http://stackoverflow.com/questions/8847766/how-to-convert-json-to-csv-format-and-store-in-a-variable
    jsonToCsv: function(json) {
        var array = typeof json != 'object' ? JSON.parse(json) : json;
        var str = '';

        for (var i = 0; i < array.length; i++) {
            var line = '';
            for (var index in array[i]) {
                var csval = array[i][index];
                if (line !== '') line += ',';

                if (/("|,|\n)/.test(csval)) {
                    // enclose value in double quotes, escaping any pre-existing
                    line += '"' + csval.replace('"', '""') + '"';
                } else {
                    line += csval;
                }
            }

            str += line + '\r\n';
        }

        return str;
    },
    
    //  Converts an ISO8061 format (i.e: PT1H3M52S) to numeric representation in seconds.
    iso8061DurationToSeconds: function (isoDuration) {
        var hoursMatch = isoDuration.match(/(\d+)H/);
        var hours = parseInt(hoursMatch ? hoursMatch[1] : 0);

        var minutesMatch = isoDuration.match(/(\d+)M/);
        var minutes = parseInt(minutesMatch ? minutesMatch[1] : 0);

        var secondsMatch = isoDuration.match(/(\d+)S/);
        var seconds = parseInt(secondsMatch ? secondsMatch[1] : 0);

        var secondsDuration = seconds + (60 * minutes) + (60 * 60 * hours);
        return secondsDuration;
    }
});