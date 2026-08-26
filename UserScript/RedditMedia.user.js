// ==UserScript==
// @name        Reddit Media
// @namespace   https://github.com/maptracker/confFiles/tree/master/UserScript
// @match       https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/media*
// @grant       none
// @version     1.0
// @author      -
// @description Renames titles to identify "Prove your humanity" tabs
// ==/UserScript==

var onion="www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion";
var com="www.reddit.com";

// Didn't work - ended up looping
// doRedirect();
// If this is a "Prove it" page, set title so tab stands out
renameProveIt()

function doRedirect() {
    // Didn't work
    var url = window.location;
    var newUrl = url.protocol + '\/\/' + com + '\/' + url.pathname + url.search;
    document.location = newUrl;
}

function renameProveIt() {
  var t = document.title;
  // logX("Title = " + t);
  if (t.match("Reddit - Prove your humanity")) {
    document.title = '---';
  }
}

function logX (msg) {
    console.log(msg);
}
