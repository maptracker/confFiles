// ==UserScript==
// @name           Reddit Comments
// @namespace      http://www.tilford.net/
// @include        http://www.reddit.com/*/comments/*
// ==/UserScript==

/* Colors score values to highlight highly-rated comments */

highlight();

function highlight() {
    var spans = document.getElementsByTagName('span');
    for (var s = 0; s < spans.length; s++) {
        var span = spans[s];
        var cn = span.className;
        if (cn != "score unvoted") continue;
        var pts = span.innerHTML;
        pts = pts.replace(' points','');
        var col = "";
        if (pts > 100) {
            col = 'lime';
        } else if (pts > 50) {
            col = 'yellow';
        }
        if (col != "") {
            span.style.backgroundColor = col;
            // GM_log(pts + ' = ' + col);
        }
    }
}