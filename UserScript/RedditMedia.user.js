// ==UserScript==
// @name        Reddit Media
// @namespace   https://github.com/maptracker/confFiles/tree/master/UserScript
// @match       https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/media*
// @grant       none
// @version     1.0.2
// @author      -
// @description Renames titles to identify "Prove your humanity" tabs
// ==/UserScript==
/* jshint esversion: 8 */

const onion="www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion";
const com="www.reddit.com";
const imgClass = 'singleImage';
isolateImage();
setStyles();
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
  newImg.className = imgClass;
  const range = document.createElement("input");
  range.type = "range";
  range.min = "1";
  range.max = "200";
  range.step = "1";
  range.value = "100";
  range.addEventListener("input", () => {
    resizeSingle(Number(range.value));
  });
  const copyLink = document.createElement('button');
  copyLink.className = "copyLink";
  copyLink.innerText = "Copy Link";
  copyLink.style.backgroundColor = "yellow";
  copyLink.style.borderRadius = "0";
  copyLink.style.fontSize = "0.6em";
  copyLink.addEventListener("click", async (event) => {
    await navigator.clipboard.writeText(newImg.src);
    event.target.style.backgroundColor = "green";
  });
  document.body.replaceChildren();
  document.body.appendChild(range);
  document.body.appendChild(copyLink);
  document.body.appendChild(document.createElement('br'));
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
function setStyles() {
  // Supporting zoom slider
  const singleSize = document.createElement("style");
  singleSize.id = "singleSize";
  singleSize.textContent = "." +imgClass + " { width: 100%; }";
  document.head.appendChild(singleSize);
}
function resizeSingle(sz) {
  const singleSize = document.querySelector("#singleSize");
  singleSize.textContent = "." +imgClass + ` { width: ${sz}%; }`;
}

function logX (msg) {
    console.log(msg);
}
