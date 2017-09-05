// ==UserScript==
// @name        Modify GOG
// @namespace   tilford.net
// @include     https://www.gog.com/en/gamecard/*
// @include     https://www.gog.com/gamecard/*
// @include     https://www.gog.com/game/*
// @include     https://www.gog.com/mix/*
// @include     https://www.gog.com/games*
// @include     https://secure.gog.com/gamecard/*
// @version     1
// ==/UserScript==


add_forum();

function add_forum () {

    var start = document.getElementsByTagName('body');
    return;

    var targ = document.getElementById('reviews') ||
        document.getElementById('firstRate');
    if (!targ) return;
    var par = targ.parentNode;
    var div = document.createElement("div");
    var url = document.location + "";
    url = url.replace('gamecard', 'forum');
    // alert(url);

    var t = document.title;
    t = t.replace(/ ●.+/, '');
    t = t.replace('™', '');
    var whq = "https://www.google.com/search?q=site:appdb.winehq.org " + t;

    div.innerHTML = "<a style='font-weight:bold' href='" + url + "'>User Forum</a>" + ' - ' + "<a style='font-weight:bold' href='" + whq + "'>WineHQ</a>";
    alert(par.firstChild);
    par.insertBefore(par.firstChild, div);

    
}