// ==UserScript==
// @name        Single Page News
// @namespace   tilford.net
// @include     http://www.washingtonpost.com/*.html
// @include     https://www.washingtonpost.com/*.html
// @include     http://abcnews.go.com/*
// @version     1
// ==/UserScript==

/* Automatically picks the 'print' option on a page */

main();

function main () {
    var l = document.location;
    var ihs = new Array();
    if (/washingtonpost.com/.test(l)) {
        ihs.push('Print');
    }
    if (!ihs.length) return;

    var as = document.getElementsByTagName('a');

    for (var ai = 0; ai < as.length; ai++) {
        var link = as[ai];
        var lih  = link.innerHTML;
        for (var i = 0; i < ihs.length; i++) {
            var ih = ihs[i];
            if (ih == lih) return redirect( link );
        }
    }
}

function redirect (link) {
    document.location = link.href;
}
