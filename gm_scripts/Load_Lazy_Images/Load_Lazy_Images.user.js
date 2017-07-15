// ==UserScript==
// @name        Load_Lazy_Images
// @namespace   TOR
// @include     https://*washingtonpost.com/*
// @version     1
// @grant       none
// @grant       GM_log
// ==/UserScript==

var imgs = document.getElementsByTagName('img');
var ilen = imgs.length;

by_attr();

function by_attr() {
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
