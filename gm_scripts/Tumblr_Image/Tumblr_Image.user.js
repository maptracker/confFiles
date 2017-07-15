// ==UserScript==
// @name        Tumblr Image
// @namespace   tilford.net
// @include     http://*.tumblr.com/image/*
// @version     1
// @grant       none
// ==/UserScript==

main();

function main() {
    var images = document.getElementsByTagName('img');
    var ilen = images.length;
    for (var i = 0; i < ilen; i++) {
        var img = images[i];
        var src = img.getAttribute("data-src");
        if (!src) continue;
        document.location = src;
    }
}
