// ==UserScript==
// @name        Disqus Filter
// @namespace   tilford.net
// @include     http://disqus.com/*
// @version     1
// ==/UserScript==

var isNumber = new RegExp('\d+$');
var parClass = new RegExp('^\s*post-content');
var showAt   = 10;

function scanVotes () {
    // return;
    var as = document.getElementsByTagName('a');
    var al = as.length;
    GM_log(al + ' links found in Disqus scan');
    var kept = 0;
    var tot  = 0;
    for (var i = 0; i < al; i++) {
        var el = as[i];
        var cn = el.className;
        if (!cn) continue;
        // GM_log("'" + cn + "'");
        if (! /^\s*vote-(up|down)/.test(cn)) continue;
        var votes = parseInt(el.textContent);
        if (typeof(votes) != 'number') continue;
        // GM_log("'" + votes + "'");
        var par = el;
        while (par && ! is_main_post(par)) { par = par.parentNode; }
        if (! is_main_post(par)) continue;
        // We have identified the main parent node block
        if (votes >= showAt) el.style.backgroundColor =
                                 /down/.test(cn) ? '#faa' : '#afa';
        var pvc = par.getAttribute('voteCount');
        if (pvc == null) {
            // First discovery
            par.setAttribute('voteCount', votes);
            tot++;
        } else if (pvc < votes) {
            // Second discovery, higher vote count
            par.setAttribute('voteCount', votes);
        } else {
            // second discovery, priory was better vote
            continue;
        }
        // GM_log(cn + " = '" + votes + "' ("+pvc+")");
        if (votes < showAt) {
            par.style.display = 'none';
        } else {
            par.style.display = 'block';
            kept++;
        }
            
    }
    var head = document.getElementById('post-count');
    GM_log(head);
    if (!head) return;
    if (kept == tot) return;
    var span = document.createElement('span');
    span.innerHTML = " <i style='color:brown'>Disqus Filter : Showing <b>"+kept+" of " +tot+ "</b> comments with at least "+showAt+" votes</i>";
    head.appendChild(span);
    // GM_log('Kept '+kept+'/'+tot);
}

function is_main_post (el) {
    if (!el) return 0;
    var cn = el.className || "";
    return parClass.test(cn) ? 1 : 0;
}

function debugNote (el) {
    var span = document.createElement('span');
    span.textContent = 'XYZ';
    el.appendChild(span);
}

setTimeout(scanVotes, 4 * 1000);

