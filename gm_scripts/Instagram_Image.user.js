// ==UserScript==
// @name        Instagram_Image
// @namespace   TOR
// @include     https://www.instagram.com/p/*
// @version     1
// @grant       none
// ==/UserScript==

/* Just go straight to an instagram image */

var prefix = "window._sharedData";
var preChk = new RegExp(prefix + "\\s*=\\s*");
var stack  = []
find_sets();

function find_sets () {
    var scripts = document.getElementsByTagName('script');
    var slen    = scripts.length;
    for (var s=0; s < slen; s++) {
        stxt = scripts[s].innerText;
        if (preChk.test(stxt)) {
            stxt = stxt.replace(preChk, "");
            stxt = stxt.replace(/\s*;\s*$/, "");
            // alert(stxt);
            data = JSON.parse(stxt);
            var pp = data["entry_data"].PostPage[0];
            var p2 = pp['graphql']['shortcode_media'];
            url = p2['display_url'];
            if (url) {
                document.location = url;
                break;
            }
        }
    }
}
