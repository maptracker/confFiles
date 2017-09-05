// ==UserScript==
// @name        Politico One Page
// @namespace   tilford.net
// @include     http://www.politico.com/*
// @version     1
// @grant       none
// ==/UserScript==

main();

function main () {
    var links = document.getElementsByTagName('a');
    for (var l = 0; l < links.length; l++) {
        var href = links[l].href;
        if (/_full.html$/.test(href) ||
            /printstory.cfm\?uuid=/.test(href)) {
            document.location = href;
            break;
        }
    }
}