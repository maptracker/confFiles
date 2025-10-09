// ==UserScript==
// @name        LinkedIn Feed Stripper
// @namespace   Violentmonkey Scripts
// @match       https://www.linkedin.com/feed/*
// @grant       none
// @version     1.0.2
// @author      -
// @description 9/5/2025, 11:51:40 AM
// ==/UserScript==

// Debugging to browser log
function logX(txt) { unsafeWindow.console.log(txt); }
logX("-- LinkedIn Junk Remover --");
// Just a whitespace cleaner for log messages:
var wsClean = new RegExp('[ \t\n\r]+', "g");

// Start 1 second after page load
setTimeout(removeJunk, 1000);

function removeJunk() {
    getInformativeElements();
    // Recurse every second
    setTimeout(removeJunk, 1000);
}

function getInformativeElements () {
    /* LinkedIn is cagey on how they class and identify objects, probably
       to prevent what I'm trying to do here. So we will find candidate
       objects, and then jump on them according to their text content
    */
    pickByText('update-components-header',
               /(^Suggested$|Promoted$| follows? |Recommended for you|Unlock your potential|LinkedIn Learning)/i);
    pickByText('update-components-actor__description',
               /(^Promoted$)/i);
}

function pickByText(findClass, textPattern) {
    // Given elements of a particular class, match against simple text patterns
    var targets = [];
    var els = document.getElementsByClassName(findClass);
    elen = els.length;
    if (elen == 0) return;
    for (var i = 0; i < elen; i++) {
        var el = els[i];
        // If we've already checked this element in a prior iteration, move on
        if (el.getAttribute("LFS-Checked")) continue;
        // Add an attribute to enable the above check
        el.setAttribute("LFS-Checked", true);
        var it = el.innerText;
        // logX(" [?] " +it.replaceAll(wsClean, " ")); // Debug
        if (it.match(textPattern)) {
            var targ = parentPost(el.parentNode)
                logX("--------\n  [!] Pattern match to /" +textPattern+"/ ("+
                     targ+"):\n" + it+"\n--------");
            if (targ) targets.push(targ);
        }
    }
    if (targets.length > 0) {
        /* For all the elements that match both the class and the text pattern,
           simply remove them from the DOM
        */
        removeElements(targets);
        logX("  [-] Found " + targets.length + " " + findClass +
             " nodes matching /" +textPattern+"/");
    }
}

function parentPost(targ) {
    // Find the feed element to remove
    if (!targ) return(false);
    // We will treat existance of data-id attribute as what we want
    var did = targ.getAttribute("data-id");
    if (did) return(targ);
    // Recurse upwards
    return parentPost(targ.parentNode);
}

function removeElements(targets) {
    // Yoink. Strip all provided elements from the DOM
    for (var i = 0; i < targets.length; i++) {
        targets[i].remove();
    }
}
