// ==UserScript==
// @name        Tumblr_Image_set
// @namespace   TOR
// @include     https://*.tumblr.com/post/*
// @version     1
// @grant       none
// ==/UserScript==

/* Not sure this is needed? */

find_sets();

function find_sets () {
    var scripts = document.getElementsByTagName('script');
    var slen    = scripts.length;
    for (var s=0; s < slen; s++) {
        stxt = scripts[s].innerText;
        if (/datePublished/.test(stxt)) {
            data = JSON.parse(stxt);
            if (data.image && data.image["@list"]) {
                //imgs = data.image["@list"];
                //alert(imgs);
            }
        }
    }
}
