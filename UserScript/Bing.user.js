// ==UserScript==
// @name        Bing_Direct_Links
// @namespace   TOR
// @match       https://www.bing.com/search*
// @version     1.0.0
// @author      Charles Tilford
// @grant       GM_log
// ==/UserScript==

/* 
   In 2022 Bing decided to proxy all links in their serches through a
   click tracker. Aside from being obnoxious and slowing down browsing
   (particularly in Tor) this prevents user styles from highlighting
   links.

   This script is attempting to extract the real target and alter the href

   It works for some hits, but Bing does not consistently include the
   sought-for JSON structure on the page. I haven't figured out why,
   though it's somewhat irrelevant if it's largely missing.
*/

(function() {
    'use strict';

    function doScan() {
        var as   = document.getElementsByTagName('a');
        var alen = as.length;
        var isLnk = new RegExp('^https://www.bing.com/ck/');
        for (var i = 0; i < alen; i++) {
            var anc = as[i];
            if (isLnk.test(anc.href)) fixLink(anc);
        }
    }

    /*
      As of Jun 2022:
      <h2>
      <a href='boguslink' />   // anc is here
      </h2>
      <div>
      <a junk>
      <div data-sc-metadata='{ JSON WITH INFO }'</div>
      </div
    */

    function fixLink(anc) {
        var h2 = anc.parentNode;
        var d1 = h2.nextElementSibling;
        var kids = d1.children;
        var klen = kids.length;
        var urls = [];
        for (var k = 0; k < klen; k++) {
            var kid  = kids[1];
            var jtxt = kid.getAttribute('data-sc-metadata');
            if (jtxt == null) continue;
            var json = JSON.parse(jtxt);
            if (json.url == null) continue;
            urls.push(json.url)
                }
        if (urls.length > 0) {
            // We seem to have found an URL
            anc.href = urls[0];
        }
    }

    var wait = 1 * 1000
    window.setTimeout(doScan, wait);
    
    // doScan();

})();

