//  The Google Analytics code has been slightly modified to work within the extension environment. 
//  See here for more information: https://developer.chrome.com/extensions/tut_analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-32334126-1']);
_gaq.push(['_trackPageview']);

(function () {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.charset = 'utf-8';
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();