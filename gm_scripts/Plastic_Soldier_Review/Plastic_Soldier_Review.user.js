// ==UserScript==
// @name        Plastic Soldier Review
// @namespace   TOR
// @include     http://www.plasticsoldierreview.com/*
// @version     1
// @grant       none
// ==/UserScript==

image_links()

function image_links () {
   var as = document.getElementsByTagName('a');
   var al = as.length;
   for (var i = 0; i < al; i++) {
      var a = as[i];
      var omd = a.getAttribute('onmousedown') || "";
     if (!omd) continue;
      var om = omd.match("PopupImage\\('(.+?)'\\)");
      if (om && om[1]) {
         a.href='http://www.plasticsoldierreview.com/'+om[1];
      }
   }
   
  
}