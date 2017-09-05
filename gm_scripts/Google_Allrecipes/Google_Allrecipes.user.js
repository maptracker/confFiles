// ==UserScript==
// @name        Google Allrecipes
// @namespace   tilford.net
// @include     http://www.google.com/search?*allrecipes.com*
// @include     https://www.google.com/search?*allrecipes.com*
// @include     https://encrypted.google.com/search?*allrecipes.com*
// @version     1
// ==/UserScript==

// Masks search results that do not have any reviews

var revCheck = new RegExp('(([,\\d]+) reviews)');
var scCheck  = new RegExp('(Rating: ([\\d\\.]+))');

setTimeout(main, 500);

function main () {
    var lis = document.getElementsByTagName('li');
    var lisL = lis.length;
    var found = 0;
    for (var l = 0; l < lisL; l++) {
        var li = lis[l];
        if (li.getAttribute('gmRevChecked')) continue;
        li.setAttribute('gmRevChecked',1);
        var liCN = li.className;
        if (liCN != 'g') continue;
        var liH = li.innerHTML;
        var rev = liH.match(revCheck);
        if (!rev || !rev[2]) {
            li.style.backgroundColor = 'yellow';
            li.style.display = 'none';
            continue;
        }
        found++;
        var revHit = rev[1];
        var revNum = rev[2].replace(',', '');
        revNum = parseFloat(revNum) + 0;
        var rCol   = "";
        if (revNum > 300) {
            rCol = 'red';
        } else if (revNum > 100) {
            rCol = 'lime';
        } else if (revNum > 50) {
            rCol = 'yellow';
        }
        var sc = liH.match(scCheck);
        if (sc && sc[2]) {
            var sHit = sc[1];
            sc = parseFloat(sc[2]) + 0;
            var sCol = "";
            if (sc >= 4.9) {
                sCol = 'red';
            } else if (sc >= 4.8) {
                sCol = 'lime';
            } else if (sc >= 4.5) {
                sCol = 'yellow';
            }
            if (sCol) liH = liH.replace(sHit,"<span style='background-color:"+
                                    sCol+ "'>"+sHit+"</span>");
            GM_log(revNum+" reviews ("+rCol+"), Score "+sc+" ("+sCol+")");
        }
        if (rCol) liH = liH.replace(revHit,"<span style='background-color:"+
                                    rCol+ "'>"+revHit+"</span>");
        
        li.innerHTML = liH;
    }
    if (found) GM_log(found+" targets marked up");
    setTimeout(main, 1000);

}