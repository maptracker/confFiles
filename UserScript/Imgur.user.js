// ==UserScript==
// @name          Imgur URL Fixer
// @namespace     https://github.com/maptracker/confFiles/tree/master/UserScript
// @include       https://imgur.com/gallery/*
// @include       https://imgur.com/t/*
// @version       1.0.2
// @grant         none
// ==/UserScript==

fixGallery()

function fixGallery() {
    // Gallery stopped working for my JS settings. Switch to functional URL
    var loc = window.location.href;
    var gal = new RegExp('\/gallery\/');
    if (gal.test(loc)) {
        var a = loc.replace(gal, '/a/');
        document.location = a;
    }
    var t = new RegExp('\/t\/[^\/]+\/');
    if (t.test(loc)) {
        var a = loc.replace(t, '/a/');
        document.location = a;
    }
    
}
