// ==UserScript==
// @name          Wikipedia Redirect
// @namespace     https://github.com/maptracker/confFiles/tree/master/UserScript
// @include       https://*.wikipedia.org/*
// @version       1.0.1
// @grant         none
// ==/UserScript==

redirectEN()

function redirectEN() {
    // Redirect Wikipedia to en.wikipedia.org
    // (from mobile and other languages)
    var desired = "en.wikipedia.org";
    var host = window.location.hostname;
    if (host == desired) return;
    var path = window.location.pathname;
    document.location = "https://" + desired + path;
}
