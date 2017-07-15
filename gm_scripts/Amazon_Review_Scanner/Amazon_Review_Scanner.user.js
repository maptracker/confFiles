// ==UserScript==
// @name        Amazon Review Scanner
// @namespace   tilford.net
// @include     https://www.amazon.com/*
// @version     1
// @grant       none
// ==/UserScript==

/* Look for halmarks of sketchy language in user reviews */

var sketchy = {
    'honest' : 1, 'fair' : 1, 'vine' : 1, 'free product' : 2, 
    'unbiased' : 2, 'discount' : 1, 'discounted' : 1, 'exchange' : 1, 
    'disclosure' : 1, 'impartial' : 1 };

var badBrands = ['black & decker', 'Hamilton Beach', 'EBL'];
// EBL : https://www.amazon.com/review/R19VQ8PHM4D9KP/ref=cm_cr_dp_cmt?ie=UTF8&ASIN=B00DNPT1AO&channel=detail-glance&nodeID=172282&store=electronics#wasThisHelpful
badBrands.map(function(x) { sketchy[x.toLowerCase()] = 1 })
var found = {};
for (var w in sketchy) { 
    found[w]   = 0;
    sketchy[w] = new RegExp('\\b'+w+'\\b');
    //alert(sketchy[w] )
}

var cr = document.getElementById('averageCustomerReviews');
if (cr) {
    var msg = find_suspicious()
    if (msg != "") {
        var al = document.createElement('span');
        cr.appendChild(al);
        al.innerHTML = "<span style='font-size:1.5em'><span style='color:red'>Sketchy:</span><br /><span style='background-color:yellow; color:red'>"+msg+"</span></span>";
    }
}

function find_suspicious () {
    var divs = document.getElementsByTagName('div');
    var dl   = divs.length;
    for (var i = 0; i < dl; i++) {
        var div = divs[i];
        if (div.className != 'a-section') continue;
        var txt   = div.innerText.toLowerCase();
        for (w in sketchy) {
            if (sketchy[w].test(txt)) found[ w ]++;
        }
    }
    var msg = "";
    for (var w in found) {
        if (n = found[w]) {
            msg = msg + "\n" + w + "=" + n;
        }
    }
    return msg;
    // if (msg != "") alert("Sketchy words:"+msg);
}
