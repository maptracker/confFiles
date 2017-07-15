// ==UserScript==
// @name           USDA Post to Get
// @namespace      tilford.net
// @include        http://www.nal.usda.gov/fnic/foodcomp/cgi-bin/nut_search_new.pl
// ==/UserScript==

var forms = document.getElementsByTagName('form');

for (var f = 0; f < forms.length; f++) {
    forms[f].method = 'GET';
    // alert(f +' = '+forms[f]);
}