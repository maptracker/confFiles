// ==UserScript==
// @name        Load_Lazy_Images
// @namespace   TOR
// @include     https://*washingtonpost.com/*
// @include     https://www.nytimes.com*
// @include     http://www.space.com/*
// @include     https://www.space.com/*
// @include     https://*reuters.com/*
// @include     https://*.cnn.com/*
// @include     https://*bloomberg.com/*
// @include     https://*qz.com/*
// @include     http://*.chicagotribune.com/*
// @include     http://*.latimes.com/*
// @include     http://*.denverpost.com/*
// @include     http://*abc7.com/*
// @include     https://*wikitribune.com/*
// @version     1
// @grant       none
// @grant       GM_log
// ==/UserScript==

/* Had lazy load tags on some elements, but apparently not needed?
   http://*cbsnews.com/*

   Quartz also needs a stylish stylesheet to mask the blurry thumbnail
   and reset opacity on the actual image
*/

var tag  = 'img';
var loc  = document.location;
var bgChk = new RegExp('(&w=[0-9]+)"');
var hrSrc = 'data-src';
var cb    = dataSrc;
var wait  = 1;

if (/washingtonpost/.test(loc)) {
    /* non-standard attributes plus a blur style */
    cb = hiResSrc;
    hrSrc = 'data-hi-res-src';
} else if (/bloomberg/.test(loc)) {
    cb = hiResSrc;
    hrSrc = 'data-native-src';
} else if (/reuters/.test(loc)) {
    /* Using a background-image CSS style to define image source */
    cb = divBackground;
} else if (/\.(chicagotribune|latimes)\./.test(loc)) {
    hrSrc = 'data-baseurl';
} else if (/\.cnn\./.test(loc)) {
    hrSrc = 'data-src-large';
} else if (/\abc\d+\./.test(loc)) {
    hrSrc = 'data-imgsrc';
    tag   = 'div';
} else {
    /* This seems like the 'standard' way to do a lazy load */
}

var imgs = document.getElementsByTagName(tag);
var ilen = imgs.length;

window.setTimeout(cb, wait);

function dataSrc() {
    for (var i = 0; i < ilen; i++) {
        var img  = imgs[i];
        var ds   = img.getAttribute( hrSrc );
        if (ds) {
            if (img.tagName != 'img') {
                newImg = document.createElement('img');
                img.appendChild(newImg);
                img = newImg;
            }
            img.src = ds;
            // alert(ds);
        }
    }
}

function hiResSrc() {
    for (var i = 0; i < ilen; i++) {
        var img  = imgs[i];
        var dhrs = img.getAttribute( hrSrc );
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
