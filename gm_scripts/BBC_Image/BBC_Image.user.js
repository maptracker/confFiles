// ==UserScript==
// @name        BBC_Image
// @namespace   TOR
// @include     http://*.bbc.com/news/*
// @version     1
// @grant       none
// ==/UserScript==

/* Repoint placeholder images to higher resolution ones */

run();

function run() {
    var imgs = document.getElementsByTagName('img');
    var ilen = imgs.length;
    var chk  = new RegExp('\\/320\\/');

    for (var i=0; i < ilen; i++) {
        var img = imgs[i];
        if (! chk.test(img.src)) continue;
        img.src = img.src.replace('/320/', '/1024/');
    }
}
