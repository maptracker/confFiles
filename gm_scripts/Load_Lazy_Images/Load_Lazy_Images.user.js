// ==UserScript==
// @name        Load_Lazy_Images
// @namespace   TOR
// @include     https://*washingtonpost.com/*
// @include     https://www.nytimes.com*
// @include     http://www.space.com/*
// @version     1
// @grant       none
// @grant       GM_log
// ==/UserScript==

var imgs = document.getElementsByTagName('img');
var ilen = imgs.length;
var loc  = document.location;

if (/washingtonpost/.test(loc)) {
    hiResSrc();
} else {
    dataSrc();
}

function dataSrc() {
    for (var i = 0; i < ilen; i++) {
        var img  = imgs[i];
        var ds   = img.getAttribute( 'data-src' );
        if (ds) img.src = ds;
    }
}

function hiResSrc() {
    for (var i = 0; i < ilen; i++) {
        var img  = imgs[i];
        var dhrs = img.getAttribute( 'data-hi-res-src' );
        if (dhrs) {
            /* WaPo has both lazy loading and a blur style on placeholders */
            img.src = dhrs;
            // Also need to turn off blur:
            img.style.filter = "unset";
            // console.log(img.className +" : Source = " + dhrs);
            continue;
        }
    }
}
