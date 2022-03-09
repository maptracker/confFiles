// ==UserScript==
// @name          Reddit Comments II
// @namespace     https://github.com/maptracker/confFiles/tree/master/UserScript
// @include       http://www.reddit.com/*/comments/*
// @include       http://np.reddit.com/*/comments/*
// @include       https://np.reddit.com/*/comments/*
// @include       http://www.reddit.com/user/*
// @include       https://www.reddit.com/*/comments/*
// @include       https://www.reddit.com/comments/*
// @include       https://www.reddit.com/user/*
// @include       https://www.reddit.com/r/*
// @include       https://www.reddit.com/
// @include       https://old.reddit.com/*
// @description   Colorizes posts and comments by count
// @version       1.0.7
// @grant         none
// ==/UserScript==

useOld()

console.log("TEST");
logX("-- Reddit Comment Highlighter --");
randomImage();
setTimeout(highlightX, 3000);

function useOld() {
    // auto-redirect to old website if on new one
    var loc = window.location.href;
    var newDom = new RegExp('\/www\.reddit\.com\/');
    if (newDom.test(loc)) {
        var old = loc.replace(newDom, '/old.reddit.com/');
        document.location = old;
    }
}

function randomImage() {
    // Weird behavior where videos often only load after you go back
    // and forth to the page. This just injects a handy image that you
    // can click on to go "forward", then oscillate the browser <- ->
    // buttons until the video loads.
    var bun   = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Conejitolindo.jpg/207px-Conejitolindo.jpg";
    var bH    = "<b>BUN</b>";
    var chk   = new RegExp('\/domain\/v\.redd\.it');
    var links = document.getElementsByTagName('a');
    var ll    = links.length;
    for (var i=0; i < ll; i++) {
        var targ = links[i];
        if (chk.test(targ.href)) {
            targ.innerHTML = bH;
            targ.href = bun;
        }
    }
}

function highlightX() {
    // Sometimes spans, sometimes divs. Links for index comment count

    var elems = [ [document.getElementsByTagName('div'),
    {"Comment__metadata": 1, "score unvoted": 1}],
                  [document.getElementsByTagName('span'),
    {"score unvoted": 1, "score-hidden": 1}],
                  [document.getElementsByTagName('a'),
    {"bylink comments may-blank": 1}]
                  ];
    logX("Scanning " + elems[0][0].length + " DIVs + "+
         elems[1][0].length + " SPANs");
    for (var e = 0; e < elems.length; e++) {
        var e2 = elems[e][0];
        var e2l = e2.length;
        var okClass = elems[e][1];
        for (var s = 0; s < e2l; s++) {
            var elem = e2[s];
            var cn = elem.className;
            var tn = elem.tagName.toLowerCase();
            if (!okClass[ cn ]) continue;
            var pts = elem.innerHTML;
            var col = "";
            var fgc = "";
            pts = pts.replace(/ points?.*/,'');
            pts = pts.replace(/ comments?.*/,'');
            if (pts == '[score hidden]') {
                col = 'silver';
            } else if (/\dk$/.test(pts)) {
                fgc = 'yellow';
                col = 'purple';
            } else {
                pts = pts.replace(',','');
                if (pts >= 1000) {
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
                    var par = elem;
                    /*
                      while (par && par.tagName != 'div' &&
                      par.className != 'entry unvoted') {
                      par = par.parentNode;
                      }
                      // if (par && par.tagName == 'div') par.style.display = 'none';
                      */
                }
            }
            // logX(pts + ' = ' + col);
            if (col != "") elem.style.backgroundColor = col;
            if (fgc != "") elem.style.color = fgc;
        }
    }
}

function logX (msg) {
    console.log(msg);
}
