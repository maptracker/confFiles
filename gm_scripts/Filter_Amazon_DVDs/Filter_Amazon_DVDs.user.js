// ==UserScript==
// @name           Filter Amazon DVDs
// @namespace      tilford.net
// @include        http://www.amazon.com/*
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_log
// ==/UserScript==

/* Allows shift-clicking on a movie to hide it from future
 * display. Maintains state with a local DB */

var prfx    = "HideAZ";

var getCode = /\/dp\/([^\/]+)\//;
var topId   = /^result_\d+$/;
main();

function main () {
    var as = document.getElementsByTagName('li');
    for (var i = 0; i < as.length; i++) {
        var anc = as[i];
        var id  = anc.id;
        // if (id) GM_log("Saw "+id);
        if (!topId.test(id)) continue;
        var cd = codeForElement( anc );
        if (!cd) continue;
        if (checkCode( cd[0] )) hideEl( anc );
        addEventSimple(anc, 'click', checkClick);
    }
}

function checkClick (evt) {
    if (evt.shiftKey) {
        // shift + ctrl = hide this image!
        return hideThumb(evt);
    }
    evt.stopPropagation();
    // GM_log("Ignoring click "+evt+evt.shiftKey+evt.altKey);
    return false;
}

function hideThumb (evt) {
    var cd = codeForElement( evt.target, 1 );
    if (!cd) return true;
    var code = cd[0];
    var el   = cd[1];
    // GM_log("Hiding "+code+" in " + el);
    hideEl( el );
    GM_setValue(prfx + code, 1);
    evt.preventDefault();
    evt.stopPropagation();
    return false;
}

function mainElement (el) {
    if (!el) return null;
    var chk = el;
    while (chk && (!chk.id || !topId.test(chk.id))) {
        chk = chk.parentNode;
    }
    return chk;
}

function codeForElement (el, vb) {
    if (!el) return null;
    var chk = mainElement(el);
    if (!chk) return null;

    var div =firstKid(chk);    
    if (!div) return null;

    var anc = firstKid(div);
    if (!anc) return null;

    var href = anc.href;
    if (!href) return null;

    var code = href.match( getCode );
    if (!code || code.length != 2) {
        //GM_log("Not found: "+href);
        return null;
    }
    code = code[1];
    //GM_log(code);
    return [code, el];
}

function children ( el ) {
    var kids = [];
    if (!el) return kids;
    // GM_log("Getting kids:" + el);
    
    var tryNodes = el.childNodes;
    var tl  = tryNodes.length;
    for (var t = 0; t < tl; t++) {
        var n = tryNodes[t];
        var tn = n.tagName;
        if (!tn) continue;
        // GM_log(tn);
        kids.push(n);
    }
    return kids;
}

function firstKid (el) {
    var arr = children(el);
    return arr[0];
}

function checkCode (code) {
    if (!code) return 0;
    return GM_getValue(prfx + code);
}

function hideEl (el) {
    var chk = mainElement(el);
    if (!chk) return null;
    chk.style.display = 'none';
}

function is_class (el, test) {
    var cs = el.className.split(' ');
    for (var c = 0; c < cs.length; c++) {
        if (cs[c] == test) return 1;
    }
    return 0;
}

function addEventSimple(obj,evt,fn) {
	if (obj.addEventListener)
		obj.addEventListener(evt,fn,false);
	else if (obj.attachEvent)
		obj.attachEvent('on'+evt,fn);
}

function removeEventSimple(obj,evt,fn) {
	if (obj.removeEventListener)
		obj.removeEventListener(evt,fn,false);
	else if (obj.detachEvent)
		obj.detachEvent('on'+evt,fn);
}
