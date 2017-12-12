// ==UserScript==
// @name        NewEgg Filter
// @namespace   tilford.net
// @include     http://*.newegg.com/*
// @version     1.0.1
// ==/UserScript==

/* Allows shift-click on a product to remove it from
 * display. Maintains state in local DB */


var prfx    = "HideNE";
var targCl  = new RegExp('itemCell'); // result box targ.className != 'result box'
var getCode = 'Item=([A-Z0-9]+)';
main();

function main () {
    var loc = document.location;
    if (/(IFrame|blank\.html)/.test(loc)) return;
    register_newegg();
}

function register_newegg () {
    var as = document.getElementsByTagName('a');
    var num = 0;
    for (var i = 0; i < as.length; i++) {
        var anc = as[i];
        var cd  = codeForElement( anc );
        if (!cd) continue;
        if (checkCode( cd[0] )) hideEl( anc );
        addEventSimple(anc, 'click', checkClick);
        num++;
        // console.log("Registered "+ cd[0] + " in " +anc );
    }
    console.log("Registered "+num+" from "+as.length+" anchor elements in "+
           document.location);
}

function checkClick (evt) {
    evt.stopPropagation();
    // alert(evt);
    if (evt.shiftKey) {
        // shift + ctrl = hide this image!
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
    // console.log(code + ' via ' + href);
    if (!code || code.length != 2) return null;
    code = code[1];
    // console.log(code);
    return [code, el];
}

function checkCode (code) {
    if (!code) return 0;
    return GM_getValue(prfx + code);
}

function hideEl (el) {
    if (!el) return;
    var targ = el;
    while (targ.parentNode && is_not_product_object(targ)) {
        targ = targ.parentNode;
    }
    if (is_not_product_object(targ)) {
        targ = el;
    }
    // console.log(targ.className);
    targ.style.display = 'none';
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

function is_not_product_object (el) {
    if (!el) return 1;
    // console.log(el.tagName);
    if (el.tagName.toLowerCase() != 'div') return 1;
    // console.log(el.className);
    if (targCl.test(el.className)) return 0;
    return 1;


    var bnt = el.getAttribute('data-bntrack');
    if (bnt) return 0;
    return 1;
}
