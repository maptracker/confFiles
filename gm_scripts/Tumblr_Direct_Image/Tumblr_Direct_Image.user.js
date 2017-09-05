// ==UserScript==
// @name        Tumblr Direct Image
// @namespace   tilford.net
// @include     https://*.tumblr.com/image/*
// @version     1
// @grant       none
// ==/UserScript==

/* Eliminates page wrapper arounds image, displays without allowing JS
 * from Tumblr */
run();

function run() {
    img = document.getElementById('content-image');
    if (img) {
        src = img.getAttribute('data-src');
        if (src) document.location = src;
    }
}
