// ==UserScript==
// @name          Twitter Redirect
// @namespace     https://github.com/maptracker/confFiles/tree/master/UserScript
// @include       https://x.com/*
// @include       https://twitter.com/*
// @version       1.0.1
// @grant         none
// ==/UserScript==

redirect()

function redirect() {
    // Redirect Twitter to XCancel
    var desired = "xcancel.com";
    var path = window.location.pathname;
    var targ = "https://" + desired + path;
    // Default sort by likes
    targ = targ.replace(/\?.*/, '');
    targ = targ + '?sort=Likes';
    document.location = targ;
}
