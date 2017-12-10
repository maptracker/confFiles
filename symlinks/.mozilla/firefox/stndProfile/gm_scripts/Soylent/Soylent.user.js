// ==UserScript==
// @name        Soylent
// @namespace   *
// @include     http://soylentnews.org/*
// @include     https://soylentnews.org/*
// @version     1
// @grant       none
// ==/UserScript==

var isArticle = new RegExp('article\\.pl\\?sid=');

scan();

function scan() {
    var links = document.getElementsByTagName('a');
    var llen  = links.length;
    for (var l = 0; l < llen; l++) {
        var link = links[l];
        var loc  = link.href;
        if (isArticle.test(loc)) {
            // console.log(loc);
            link.href = loc + '&mode=flat&threshold=4&highlightthresh=4';
        }
    }
}
