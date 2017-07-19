// ==UserScript==
// @name        Load_Lazy_Images
// @namespace   TOR
// @include     https://*washingtonpost.com/*
// @include     https://www.nytimes.com*
// @include     http://www.space.com/*
// @include     https://*reuters.com/*
// @version     1
// @grant       none
// @grant       GM_log
// ==/UserScript==

var imgs = document.getElementsByTagName('img');
var ilen = imgs.length;
var loc  = document.location;
var bgChk = new RegExp('(&w=[0-9]+)"');

if (/washingtonpost/.test(loc)) {
    /* non-standard attributes plus a blur style */
    hiResSrc();
} else if (/reuters/.test(loc)) {
    /* Using a background-image CSS style to define image source */
    divBackground();
} else {
    /* This seems like the 'standard' way to do a lazy load */
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

function divBackground() {
    var divs = document.getElementsByTagName('div');
    var dlen = divs.length;
    for (var d = 0; d < dlen; d++) {
        var div  = divs[d];
        var bg   = div.style["background-image"];
        if (!bg) continue;
        var bgm  = bg.match(bgChk);
        if (bgm && bgm[1]) {
            w = bgm[1];
            div.style["background-image"] = bg.replace(w, "&w=1280");
        }
    }
}
