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
// ==/UserScript==
log("-- Reddit Comment Highlighter --");

setTimeout(highlight, 3000);
// repoint_r_news();

function highlight() {
    // Sometimes spans, sometimes divs
    var elems = [ document.getElementsByTagName('div'),
		  document.getElementsByTagName('span') ];
    log("Scanning " + elems[0].length + " DIVs + "+ elems[1].length + " SPANs");
    for (var e = 0; e < elems.length; e++) {
	var e2 = elems[e];
	var e2l = e2.length;
	for (var s = 0; s < e2l; s++) {
            var elem = e2[s];
            var cn = elem.className;
	    var tn = elem.tagName.toLowerCase();
            if ((tn == 'div' && cn != "Comment__metadata") ||
		(tn == 'span' && cn != "score unvoted" &&
                 cn != 'score-hidden')) continue;
            var pts = elem.innerHTML;
            var col = "";
            // log(pts + ' = ' + col);
	    pts = pts.replace(/ points?.*/,'');
            if (pts == '[score hidden]') {
		col = 'silver';
            } else if (/\dk$/.test(pts)) {
		elem.style.color = 'yellow';
		col = 'purple';
            } else {
		pts = pts.replace(',','');
		if (pts >=  1000) {
		    col = 'purple';
		    elem.style.color = 'white';
		} else if (pts >= 100) {
		    col = 'lime';
		} else if (pts >= 50) {
		    col = 'yellow';
		} else if (pts < -100) {
		    col = 'black';
		} else if (pts <= 5) {
		    var par = elem;
		    while (par && par.tagName != 'div' && 
			   par.className != 'entry unvoted') {
			par = par.parentNode;
		    }
		    if (par) par.style.display = 'none';
		}
            }
            if (col != "") {
		elem.style.backgroundColor = col;
		//log(pts + ' = ' + col);
            }
	}
    }
}

function log (msg) {
    unsafeWindow.console.log(msg)
}

function repoint_r_news () {
    var links = document.getElementsByTagName('a');
    var llen = links.length;
    for (var i = 0; i < llen; i++ ) {
       var link = links[i];
       if (link.href == "https://www.reddit.com/r/news/") {
           link.href = "https://www.reddit.com/r/uncensorednews";
       }
    }
}
