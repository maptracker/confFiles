// ==UserScript==
// @name        Pinterest
// @namespace   TOR
// @include     https://www.pinterest.com/pin/*
// @include     https://www.pinterest.com/*
// @version     1
// @grant       none
// ==/UserScript==

var debug = [];
process();
 alert( debug.join('\n'));

function process() {
  var links = document.getElementsByTagName('a');
  var ll = links.length;
  for (var l = 0; l < ll; l++) {
    var link = links[l];
    var href = link.href;
    if (!/\/pin\/\d+\/$/.test(href)) continue;
    var img = link.firstChild;
    // alert(img);
    if (img === null) continue;
    if (img.tagName.toLowerCase() != 'img') continue;
    //alert(img.src);
    debug.push(img.src);
    if (/\.(png|gif|jpeg|jpg)$/.test(img.src)) {
      link.href = img.src;
    }
  }
}
