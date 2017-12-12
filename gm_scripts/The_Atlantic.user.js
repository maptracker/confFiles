// ==UserScript==
// @name        The Atlantic
// @namespace   Foo
// @include     http://www.theatlantic.com/*
// @version     1
// @grant       none
// ==/UserScript==

replace();

function replace () {

   var imgs  = document.getElementsByTagName('img')
   var il = imgs.length;
   for (var i = 0; i < il; i++) {
      var img = imgs[i];
      var url = img.getAttribute('data-src');
      if (!url) continue;
      img.src = url;
     img.className = "";
   }
}