// ==UserScript==
// @name           ixQuick Repoint Image Links
// @namespace      http://www.tilford.net/
// @include        https://ixquick.com/do/search?*cat=pics*
// ==/UserScript==

main();

function main () {
    var as = document.getElementsByTagName('a');
    for (var i = 0; i < as.length; i++) {
        var a = as[i];
        var href = a.href;
        var rd = getQuerystring('oiu', href);
        if (!rd) continue;
        rd = unescape(rd);
        a.href = rd;
        a.onclick = null;
    }
}

function getQuerystring(key, src) {
  key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regex = new RegExp("[\\?&]"+key+"=([^&#]*)");
  if (!src) src = window.location.href;
  var qs = regex.exec(src);
  if(qs == null)
      return "";
  else
    return qs[1];
}