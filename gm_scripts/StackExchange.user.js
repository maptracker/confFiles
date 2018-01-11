// ==UserScript==
// @name        StackExchange
// @namespace   *
// @include     https://*.stackexchange.com/*
// @include     https://serverfault.com/*
// @include     https://stackoverflow.com/*
// @include     https://superuser.com/*
// @version     1
// @grant       none
// ==/UserScript==

/* Color code vote counts */

highlight();

function highlight() {
    // https://stackoverflow.com/a/222847
    var votes = document.getElementsByClassName("vote-count-post");
    var mini  = document.getElementsByClassName("mini-counts");
    votes  =  Array.prototype.slice.call(votes).concat(Array.prototype.slice.call(mini));
    var vl = votes.length;
    var msg = "";
    var comSty = "; padding:5px";
    for (var v = 0; v < vl; v++) {
        var sp = votes[v];
        var n = sp.innerText;
        var pow = n.match(/^([0-9]+)(k|m)$/);
        if (pow && pow[1]) {
            x = pow[2].toLowerCase();
            if (x == 'k') {
                n = pow[1] * 1000;
            } else if (x == 'm') {
                n = pow[1] * 1000000;
            }
        }
        var sty = "";
        if (n >= 1000) {
            sty = "background-color:#000; color: #fff";
        } else if (n > 100) {
            sty = "background-color:#f66";
        } else if (n > 50) {
            sty = "background-color:#ff6";
        } else if (n > 30) {
            sty = "background-color:#6f6";
        } else if (n > 15) {
            sty = "background-color:#aaf";
        }
        if (sty != "") sp.style = sty + comSty;
        msg = msg + " " + n;
    }
    // alert(msg);
}
