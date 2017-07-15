// ==UserScript==
// @name        Modify GOG
// @namespace   tilford.net
// @include     http://www.gog.com/en/gamecard/*
// @include     http://www.gog.com/gamecard/*
// @include     http://www.gog.com/game/*
// @include     https://secure.gog.com/gamecard/*
// @version     1
// ==/UserScript==

/* Need to update */

/* Adds link to forum from game card page (normally you can only find
 * the link after purchasing game) */

add_forum();

function add_forum () {
    var targ = document.getElementById('reviews_add_yours') ||
        document.getElementById('firstRate');
    if (!targ) return;
    var par = targ.parentNode.parentNode;
    var div = document.createElement("div");
    var url = document.location + "";
    url = url.replace('gamecard', 'forum');
    // alert(url);

    var t = document.title;
    t = t.replace(/ for download.+/, '');
    t = t.replace('™', '');
    var whq = "https://www.google.com/search?q=site:appdb.winehq.org " + t;

    div.innerHTML = "<a style='font-weight:bold' href='" + url + "'>User Forum</a>" + ' - ' + "<a style='font-weight:bold' href='" + whq + "'>WineHQ</a>";
    par.appendChild(div);

    
}