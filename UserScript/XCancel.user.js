// ==UserScript==
// @name          XCancel
// @namespace     https://github.com/maptracker/confFiles/tree/master/UserScript
// @match         https://xcancel.com/*
// @description   Hides low-vote tweets
// @version       1.0.1
// @grant         none
// ==/UserScript==

// Array to hold all comment elements, plus their score
var voteClass = "icon-heart";
var minVote = 10;
var firstScan = true;

logX("-- XCancel Tweet Hider --");
setTimeout(scanStats, 3000);

function scanStats() {
    var hearts = document.getElementsByClassName(voteClass);
    var hl = hearts.length;
    if (firstScan) {
        logX("[*] "+hl+ " replies identified on load");
        firstScan = false;
    }
    for (var i=0; i < hl; i++) {
        processTweet(hearts[i]);
    }
    // setTimeout(scanStats, 3000); // not needed, apparently
}

function processTweet(el) {
    if (el.doneAlready) return;
    el.doneAlready = true;
    var votes = el.parentNode.innerText;
    // Set zero for no value
    if (!votes) votes = "0";
    // Remove non-numeric, especially ','
    votes = parseInt(votes.replace(/[^0-9]/g,''));
    // If we appear to have the minimum number of votes do nothing else
    if (votes >= minVote) {
        logX("[+] "+votes+ " votes");
        return;
    }
    // Find appropriate parent node to hide
    while (1) {
        el = el.parentNode;
        if (!el) {
            logX("??? "+votes+ " votes - failed to identify parent");
            return; // Somehow failed to find right parent
        }
        var cn = el.className || "";
        if (cn.match("thread-line")) {
            // This appears to be the main tweet element
            el.style.display = "none";
            logX("--- "+votes+ " votes");
            return;
        }
    }
    logX("?!? "+votes+ " votes - generally failed??");
}

function logX (msg) {
    console.log(msg);
}
