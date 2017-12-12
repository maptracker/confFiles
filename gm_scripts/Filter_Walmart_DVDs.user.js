// ==UserScript==
// @name           Filter Walmart DVDs
// @namespace      tilford.net
// @include        http://www.walmart.com/*
// @version        1.0.1
// ==/UserScript==

/* Allows shift-clicking on a video to hide it from future
 * display. Maintains state with a local DB */

var prfx    = "HideWM";

var getCode = /([0-9]{6,})/;
main();

function main () {
    var as = document.getElementsByTagName('img');
    for (var i = 0; i < as.length; i++) {
        var anc = as[i];
        var cn  = anc.className;
        // if (cn) console.log("Saw "+cn);
        if (!/prodImg/.test(cn)) continue;
        var cd = codeForElement( anc );
        if (!cd) continue;
        if (checkCode( cd[0] )) hideEl( anc );
        addEventSimple(anc, 'click', checkClick);
    }
}

function checkClick (evt) {
    if (evt.shiftKey) {
        // shift + ctrl = hide this image!
        evt.preventDefault();
        evt.stopPropagation();
        return hideThumb(evt);
    }
     // console.log("Ignoring click "+evt+evt.shiftKey+evt.altKey);
    return false;
}

function hideThumb (evt) {
    var cd = codeForElement( evt.target, 1 );
    if (!cd) return true;
    var code = cd[0];
    var el   = cd[1];
    // console.log("Hiding "+code+" in " + el);
    hideEl( el );
    GM_setValue(prfx + code, 1);
    evt.stopPropagation();
    return false;
}

function codeForElement (el, vb) {
    if (!el) return null;
    while (el.parentNode && el.tagName != 'A' ) {
        el = el.parentNode;
    }
    if (el.tagName != 'A') {
        if (vb) console.log("Failed to find anchor "+el);
        return null;
    }
    var href = el.href;
    var code = href.match( getCode );
    if (!code || code.length != 2) return null;
    code = code[1];
    console.log(code);
    return [code, el];
}

function checkCode (code) {
    if (!code) return 0;
    return GM_getValue(prfx + code);
}

function hideEl (el) {
    if (!el) return;
    var targ = el;
    while (targ.parentNode && !is_class(targ, 'item')) {
        targ = targ.parentNode;
    }
    if (!is_class(targ, 'item')) targ = el;
    targ.style.display = 'none';
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
