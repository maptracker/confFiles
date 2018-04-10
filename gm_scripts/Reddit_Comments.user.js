// ==UserScript==
// @name           Reddit Comments
// @namespace      http://www.tilford.net/
// @include        http://www.reddit.com/*/comments/*
// @include        http://np.reddit.com/*/comments/*
// @include        https://np.reddit.com/*/comments/*
// @include        http://www.reddit.com/user/*
// @include        https://www.reddit.com/*/comments/*
// @include        https://www.reddit.com/comments/*
// @include        https://www.reddit.com/user/*
// @include        https://www.reddit.com/r/*
// @include        https://www.reddit.com/
// @version        1.1
// @grant          none
// ==/UserScript==
console.log("-- Reddit Comment Highlighter --");

setTimeout(highlight, 3000);
// repoint_r_news();

function highlight() {
    // Sometimes spans, sometimes divs. Links for index comment count

    // YEEAARRGGG. 9 April 2018 - New, heavily-obfuscated DOM structure

    var spans = document.getElementsByTagName('span');
    var sNum  = spans.length;
    console.log("Scanning " + sNum + " SPANs");
    for (var e = 0; e < spans.length; e++) {
        var elem = spans[e];
        var pts  = elem.innerText.toLowerCase();
        var col = "";
        var fgc = "";
        if (pts == 'score hidden') {
            col = 'silver';
        } else {
	    pts = pts.replace(/ points?.*/,'');
	    pts = pts.replace(/ comments?.*/,'');
            if (/\dk$/.test(pts)) {
		fgc = 'yellow';
		col = 'purple';
            } else {
		pts = pts.replace(',','');
		if (pts >=  1000) {
		    col = 'purple';
		    fgc = 'white';
		} else if (pts >= 100) {
		    col = 'lime';
		    fgc = 'black';
		} else if (pts >= 50) {
		    col = 'yellow';
		} else if (pts < -100) {
		    col = 'black';
		    fgc = 'white';
		} else if (pts <= 5) {
		    var par = elem.parentNode.parentNode;
		    if (par) par.style.display = 'none';
		}
            }
        }
        if (col != "")  elem.style.backgroundColor = col;
        if (fgc != "")  elem.style.color = fgc;
    }

    var links = document.getElementsByTagName('a');
    for (var l = 0; l < links.length; l++) {
        links[l].removeAttribute('rel');
    }
}
