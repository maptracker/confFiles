// ==UserScript==
// @name        Reddit Media
// @namespace   https://github.com/maptracker/confFiles/tree/master/UserScript
// @match       https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/media*
// @grant       none
// @version     1.0.1
// @author      -
// @description Renames titles to identify "Prove your humanity" tabs
// ==/UserScript==

var onion="www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion";
var com="www.reddit.com";
isolateImage();
renameProveIt();

function isolateImage() {
  const mel = document.querySelector("main");
  if (!mel) {
    logX("[x] Reddit Media - Awaiting main object");
    setTimeout(isolateImage, 1000);
    return(false);
  }
  const img = mel.querySelector("img");
  if (!img) {
    logX("[x] Reddit Media - Awaiting img");
    setTimeout(isolateImage, 1000);
    return(false);
  }
  const newImg = document.createElement('img');
  newImg.src = img.src;
  document.body.replaceChildren();
  document.body.appendChild(newImg);
}

// If this is a "Prove it" page, set title so tab stands out
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
