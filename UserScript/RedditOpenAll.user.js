// ==UserScript==
// @name        Reddit gallery mass open
// @namespace   https://github.com/maptracker/confFiles/tree/master/UserScript

// @match       https://old.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/r/*
// @match       https://old.reddit.com/r/*
// @grant       none
// @version     1.0
// @author      Charles Tilford
// @description Adds a button to Reddit image galleries to open all images in new tabs
// ==/UserScript==

var urls = []; // The list of identified URLs
var but;       // The added "Open All" button

findLinks();
addButton();

function findLinks() {
    // Gallery thumbnails are in a classed anchor
    var links = document.getElementsByClassName('gallery-item-thumbnail-link');
    for (i=0; i < links.length; i++) {
        var el = links[i];
        if (el.tagName != 'A') continue;
        urls.push( el.href );
    }
}

function openAll() {
    // Triggered after clicking button
    // Cycle through all urls, open in new tabs
    but.style.backgroundColor = 'pink';
    var cnt = 0;
    for (i=0; i < urls.length; i++) {
        but.innerText = "Opening " + (i+1);
        openTab(urls[i]);
        cnt++;
    }
    but.innerText = "Opened " + cnt + " tabs";
    but.style.backgroundColor = 'lime';
}

function openTab(href) {
    // Will require the domain to allow pop-ups
    // Will redirect focus to the opened window
    var win = window.open(href, '_blank');
}

async function openTabBackground(href) {
    // DOES NOT WORK (for multiple tabs, which is kinda the point)

    // Opening new tab in background
    //   https://stackoverflow.com/a/11389138
    // Apparently won't work in Chrome?

    // Also would only open a single window in Firefox
    // Even after pop-ups were allowed
    var opener = document.createElement("a");
    opener.href = href;
    var evt = document.createEvent("MouseEvents");
    //the tenth parameter of initMouseEvent sets ctrl key
    evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0,
                       true, false, false, false, 0, null);
    opener.dispatchEvent(evt);
    // Tried sleeping a bit, but that did not help either
    // await sleep(1000);
}

function addButton() {
    // Do nothing if no links were found
    if (urls.length == 0) return;
    // Put a button between the post header and the gallery
    var tm = document.getElementsByClassName('top-matter');
    if (tm.length == 0) return;
    but = document.createElement('button');
    but.style.backgroundColor = 'yellow';
    but.innerText = "Open All " + urls.length + " Images";
    but.onclick = openAll;
    tm[0].appendChild(but);
}

function sleep(ms) {
    // https://stackoverflow.com/a/39914235
    return new Promise(resolve => setTimeout(resolve, ms));
}
