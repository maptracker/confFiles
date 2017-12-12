// ==UserScript==
// @name        ReaperImgAllLarge
// @namespace   *
// @include     https://www.reapermini.com/InspirationGallery/*
// @version     1
// @grant       none
// ==/UserScript==

srcChk = new RegExp("gallery\\\/2\\\/");
run();


function run() {
    imgs = document.getElementsByTagName('img');
    ilen = imgs.length;
    for (i=0; i < ilen; i++) {
        img = imgs[i];
        src = img.src;
        if (srcChk.test(src)) {
            src = src.replace(srcChk, "gallery/4/");
            img.src = src;
            img.parentNode.style="";
        }
    }
}
