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
// @match         https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/*/comments/*
// @match         https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/comments/*
// @match         https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/user/*
// @match         https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/r/*
// @match         https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/
// @match         https://old.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/*
// @description   Colorizes posts and comments by count
// @version       1.0.17
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
    var newDom = new RegExp('^https:\/\/www\.');
    if (newDom.test(loc)) {
        var old = loc.replace(newDom, 'https://old.');
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
    colorRecentness();
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

/* -------------------------------------------------------------------
 * Colorizing post times
 * This is to allow using filters like "last 24 hours" but highlighting
 * and allowing filtering on entries from the last 8 hours.
 * Use case: Read 24-hour news in morning, read again in evening, filter
 * for last 12 hours
 * -------------------------------------------------------------------
 */

var recent, middle, later;
/* Trying to get a gradient that doesn't overlap with score colors
 * and also does not have gray in the middle. I had to add a midpoint
 * color to avoid an ungly center point
 * Colors via https://www.visibone.com/products/ebk1_850.jpg
 */

recent = [255, 153, 153]; // Light Red
recent = [255,   0, 204]; // Magenta
later  = [204, 255, 255]; // Light Blue
middle = [255,   0, 204]; // Magenta

recent = [255,  51,  53]; // Light Magenta
middle = [255, 255, 204]; // Pale Yellow
later  = [ 51, 153, 255]; // Darker Blue

function midHex (frac, lo, hi) {
    // Given low and high values (0-255) and a fraction between them,
    // return the two character hex value representing that midpoint
    if (lo < 0) lo = 0;
    if (hi > 255) hi = 255;
    if (frac < 0) {
        frac = 0;
    } else if (frac > 1) {
        frac = 1;
    }
    // Make hexidecimal
    //  https://stackoverflow.com/a/16360660
    var mid = Math.ceil(lo + frac * (hi - lo));
    var hx  = mid.toString(16);
    return (hx.length == 1) ? '0'+hx :  hx;
}

function gradStyle (frac) {
    // Create style string for gradient background color
    // frac = fraction (0-1) along gradient
    // Midpoint is taken at 0.5
    var p1 = recent;
    var p2 = middle;
    if (frac > 0.5) {
        p1 = middle;
        p2 = later;
        frac = (frac - 0.5) * 2;
    } else {
        frac *= 2;
    }

    return "#" +
        midHex(frac, p1[0], p2[0]) +
        midHex(frac, p1[1], p2[1]) +
        midHex(frac, p1[2], p2[2]);
}

/* Try to auto-detect the scope of threads being shown
 * That is, look for Reddit's drop-down time filter and parse the current value
 * We will do two things:
 * 1. Determine the current value
 * 2. Add a gradient legend
 * The legend will also be clickable, and will act as a filter
 */

var maxScale = 24;
var maxName = "1 day";
function findScale () {
    // Interface uses "selected" element
    var chk = document.getElementsByClassName('selected');
    var ok = /^(past hour|past 24 hours|past week|past month|past year|all time)$/i;
    for (var i = 0; i < chk.length; i++) {
        var it = chk[i].innerText;
        if (it.match(ok)) {
            // Looks like we found what we want
            if (it.match(/past hour/i)) {
                maxScale = 1;
                maxName = "1 hour";
            } else if (it.match(/week/i)) {
                maxScale = 24 * 7;
                maxName = "1 week";
            } else if (it.match(/month/i)) {
                maxScale = 30 * 24;
                maxName = "30 days";
            } else if (it.match(/year/i) || it.match(/all/i)) {
                maxScale = 365 * 24;
                maxName = "1 year";
            }
            // el is going to hold the legend
            var el = document.createElement("span");
            el.innerHTML="&nbsp;:&nbsp;now&nbsp;";
            // How many segments in the legend?
            var gradBits=20;
            // Build color scale with non-breaking spaces
            for (j = 0; j <= gradBits; j++) {
                var gb = document.createElement("span");
                gb.innerHTML="&nbsp;"
                    const frac = j/gradBits;
                gb.style.backgroundColor=gradStyle(j/gradBits);
                // Make each element of legend a clickable interface
                // to the time filter function
                gb.style.cursor = "crosshair";
                gb.onclick = "filterByTime("+(Math.ceil(100*frac)/100)+")";
                gb.onclick = function() { filterByTime(frac) };
                el.appendChild(gb);
            }
            // Final text indicating extent of gradient range
            var fin = document.createElement("span");
            fin.innerHTML="&nbsp;"+maxName;
            // Clicking on the max time should remove all time filters
            fin.style.cursor = "crosshair";
            fin.onclick = function() { filterByTime(9999999) };
            el.appendChild(fin);
            // Append the legend just outside the drop-down interface
            chk[i].parentNode.parentNode.appendChild(el);
            //alert("maxScale: "+maxScale+ " maxName: "+maxName);
            break;
        }
    }
}

/* Find all timestamps and color them with the "recentness" gradient.
 * Also build an array structure of these stamps, which will be used
 * to filter values
 */
var timeFilterList = []; // Will hold filterable elements
var tre = new RegExp("^([0-9]+|a|an) (hour|day|week|minute|year)s?", "i");
function colorRecentness () {
    findScale(); // Determine maximum time to scale against
    var times = document.getElementsByTagName("time");
    for (var i = 0; i < times.length; i++) {
        var el = times[i];
        var it = el.innerText;
        if (it.match(tre)) {
            // Appears to be in the format 'x hours'
            // What fraction of the time scale has elapsed?
            var nt = it.replace(/ .+/, ''); //isolate the number
            // Recognize use of a/an for singular values:
            if (nt.match(/^(a|an)$/i)) nt = "1";
            nt = Number(nt); // numeric value
            // Normalize everything to hours
            if (it.match(/minute/i)) {
                nt /= 60;
            } else if (it.match(/day/i)) {
                nt *= 24;
            } else if (it.match(/week/i)) {
                nt *= 24 * 7;
            } else if (it.match(/month/i)) {
                nt *= 24 * 30;
            } else if (it.match(/year/i)) {
                nt *= 24 * 365;
            }
            // Given the current scale, what fraction along the scale
            // is this entry?
            var frac = nt / maxScale;
            el.style.backgroundColor = gradStyle( frac );
            // Can we find a filterable parent?
            var par = parFromTime(el);
            if (par) timeFilterList.push([par, frac]);
        }
    }
}

function filterByTime (frac) {
    // onclick event requesting to filter visibile elements to a particular
    // scale fraction or more recent
    for (var i=0; i < timeFilterList.length; i++) {
        var tfl = timeFilterList[i];
        // first array element is the DOM element to be filtered,
        // second value is it's fraction
        if  (tfl[1] > frac) {
            // Older than requested fraction - hide
            tfl[0].style.display = "none";
        } else {
            tfl[0].style.display = "inline";
        }
    }
}

function parFromTime (el) {
    // Find the "relevant" parent object from a time element
    var par = el.parentNode;
    if (!par || !par.classList) return null; // Got to root without finding anything
    if (par.classList.contains('entryzzz') ||
        par.classList.contains('thing')) {
        // entry = comment. This caused problem with subreddit lists
        // thing = subredit list entry?
        return(par);
    }
    // Recurse upwards
    return(parFromTime(par));
}
