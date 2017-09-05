// ==UserScript==
// @name        NJ.com image adder
// @namespace   Foo
// @description nj.com image 
// @include     http://www.nj.com/*
// @version     1
// @grant       none
// ==/UserScript==

replace();

function replace () {
   var spans = document.getElementsByTagName('span')
   var sl = spans.length;
   for (var i = 0; i < sl; i++) {
      var span = spans[i];
      if (!span) continue;
      var url = span.getAttribute('data-image');
      if (!url) continue;
      span.parentNode.innerHTML = "<img src='"+url+"' />";
   }
   var imgs  = document.getElementsByTagName('img')
   var il = imgs.length;
   for (var i = 0; i < il; i++) {
      var img = imgs[i];
      var url = img.getAttribute('data-original');
      if (!url) continue;
      img.src = url;
   }
}