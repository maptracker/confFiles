// ==UserScript==
// @name          Reddit Comments II
// @namespace     https://github.com/maptracker/confFiles/tree/master/UserScript
// @match         http://www.reddit.com/*/comments/*
// @match         http://np.reddit.com/*/comments/*
// @match         https://np.reddit.com/*/comments/*
// @match         http://www.reddit.com/user/*
// @match         https://www.reddit.com/*/comments/*
// @match         https://www.reddit.com/comments/*
// @match         https://www.reddit.com/user/*
// @match         https://www.reddit.com/r/*
// @match         https://www.reddit.com/
// @match         https://old.reddit.com/*

// @match         https://old.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/*/comments/*
// @match         https://old.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/comments/*
// @match         https://old.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/user/*
// @match         https://old.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/r/*
// @match         https://old.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/
// @match         https://old.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/*

// @description   Colorizes posts and comments by count
// @version       1.0.12
// @grant         none
// ==/UserScript==

useOld();

// Array to hold all comment elements, plus their score
var coms = [];
var comAreaClass = "commentarea"
var comEl = document.getElementsByClassName(comAreaClass)[0];
var noteEl = document.createElement('div');

console.log("TEST");
logX("-- Reddit Comment Highlighter --");
// randomImage();
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
    var bun = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Conejitolindo.jpg/207px-Conejitolindo.jpg";
    var bH = "<b>BUN</b>";
    var chk = new RegExp('\/domain\/v\.redd\.it');
    var links = document.getElementsByTagName('a');
    var ll = links.length;
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
    {"Comment__metadata": 1, "score unvoted": 1 }],
                  [document.getElementsByTagName('span'),
    {"score unvoted": 1, "score-hidden": 1}],
                  [document.getElementsByTagName('a'),
    {"bylink comments may-blank": 1}]
                  ];
    logX("Scanning " + elems[0][0].length + " DIVs + "+
         elems[1][0].length + " SPANs");
    for (var e = 0; e < elems.length; e++) {
        // Primary object-type loop (div, span, a)
        var e2 = elems[e][0];
        var e2l = e2.length;
        var okClass = elems[e][1];
        for (var s = 0; s < e2l; s++) {
            // Looping over objects
            var elem = e2[s];
            // Only consider objects with certain classes:
            var cn = elem.className;
            if (!okClass[ cn ]) continue;

            var tn = elem.tagName.toLowerCase(); // not used?
            var pts = elem.innerHTML;
            var col = "";
            var fgc = "";
            pts = pts.replace(/ points?.*/,'');
            pts = pts.replace(/ comments?.*/,'');
            if (pts == '[score hidden]') {
                col = 'silver';
                pts = 10;
            } else if (pts == '[removed]' || pts == '[deleted]') {
                col = 'red';
                pts = -10;
            } else if (/\dk$/.test(pts)) {
                // abbreviated thousands
                fgc = 'yellow';
                col = 'purple';
                pts = 10000;
            } else {
                pts = pts.replace(',','');
                pts = parseInt(pts);
                if (isNaN(pts)) {
                    pts = 0;
                } else if (pts >= 1000) {
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
            var cEl = elem.parentNode.parentNode;
            coms.push( [ cEl, pts ] );
        }
    }
    filterButtons();
}

function filterButtons () {
    if (!comEl) return;
    // sort elements by score
    var clen = coms.length;
    if (clen < 20) return;
    coms.sort( function(a, b){return b[1] - a[1]} );
    // Style to mask below-threshold comments
    var maskStyle = document.createElement('style');
    var styBits = [];
    for (var si = 2; si <= 10; si++) {
        styBits.push(".ca"+si+" * .cm"+si);
    }
    maskStyle.innerHTML = styBits.join(",") + " { display: none ! important }";
    comEl.parentNode.insertBefore(maskStyle, comEl);
    // Div to hold percentile buttons
    var butDiv = document.createElement('div');
    butDiv.appendChild(noteEl);
    comEl.parentNode.insertBefore(butDiv, comEl);
    // Feedback on number of comments being shown:
    noteEl.innerHTML = "All comments shown";
    noteEl.style.fontStyle = "italic";
    noteEl.style.fontSize = "1em";
    // Make percentile buttons
    var k = 0, dbg="";
    for (var i = 1; i <= 10; i++) {
        // score threshold for this percentage:
        var thres = coms[ Math.ceil( clen * i / 10 ) - 1][1];
        var bt = document.createElement('button');
        var setClass = "";
        for (var j = i+1; j <= 10; j++) { setClass += " ca"+j; }
        bt.innerHTML = (i*10)+"%";
        bt.threshold = thres;
        bt.thresholdClass = setClass;
        bt.numCom = 0;
        bt.onclick = function() { doFilter(this) };
        butDiv.append(bt);
        // Set comment element classes
        var ceCls = " cm"+i;
        dbg += "["+i+" = "+thres+"] ";
        while (k < clen) {
            if (coms[k][1] < thres) { dbg += "("+coms[k][1]+" < "+thres+") "; break } ;
            coms[k][0].className = coms[k][0].className + ceCls;
            dbg += coms[k][1] + " ";
            k++;
            bt.numCom++;
        }
        // Start initially at 10% filtering
        if (i == 1) doFilter(bt);

    }
    // alert(dbg);
}

function doFilter(x) {
    var tc = x.thresholdClass;
    comEl.className = comAreaClass + tc;
    noteEl.innerHTML = "Top "+ x.innerHTML + " shown (&ge;"+x.threshold+" points)";
}

function logX (msg) {
    console.log(msg);
}
