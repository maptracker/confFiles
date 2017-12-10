// ==UserScript==
// @name        DeviantArt
// @namespace   tilford.net
// @include     http://*.deviantart.com/art/*
// @version     1
// @grant       none
// ==/UserScript==

var chk = new RegExp('Download','');
var typ = new RegExp('(JPG|PNG)');
autolink();

function autolink () {
    var links = document.getElementsByTagName('a');
    for (var l = 0; l < links.length; l++) {
        var link = links[l];
        var txt = link.textContent;
        if (! chk.test(txt)) continue;
        if (! typ.test(txt)) continue;
        var href = link.href;
        window.location = href;
        return;
        // console.log(txt);
    }
    // https://stackoverflow.com/questions/330337/how-do-i-close-a-firefox-tab-from-a-greasemonkey-script
    window.close();
}