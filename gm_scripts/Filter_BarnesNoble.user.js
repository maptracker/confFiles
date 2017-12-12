// ==UserScript==
// @name           Filter BarnesNoble
// @namespace      tilford.net
// @include        http://*barnesandnoble.com/*
// ==/UserScript==

/* Allows shift+ctrl clicking on a movie to hide from future
 * display. Maintains state with local database */

var prfx    = "HideBN";
var targCl  = new RegExp('result'); // result box targ.className != 'result box'
var priceRE = new RegExp('(price|onlineprice)','i');
var getCode;
main();

function main () {
    var loc = document.location;
    if (/barnesandnoble/.test(loc)) {
        getCode = /([0-9]{6,})/;
        register_bn();
    } else if (/walmart/.test(loc)) {
        getCode = /\/ip\/([0-9]+)$/;
        register_wm();
    } else {
        GM_log("Could not determine domain from" + loc);
        return;
    }
}

function register_bn () {
    var as = document.getElementsByTagName('a');
    GM_log("Looking at "+as.length+" anchor elements");
    for (var i = 0; i < as.length; i++) {
        var anc = as[i];
        var par = anc.parentNode;
        var cn  = anc.className;
        var pcn = par ? par.className : "";
        //GM_log("Considered "+cn+" / " + pcn);
        if (!(/(linked-image|thumb)/.test(cn) ||
              /(image-block|wgt-product-image-module)/.test(pcn))) 
            continue;
        //GM_log("Considered "+cn+" / " + pcn);
        var cd = codeForElement( anc );
        if (!cd) continue;
        if (checkCode( cd[0] )) hideEl( anc );
        addEventSimple(anc, 'click', checkClick);
        // GM_log("Registered "+anc+" in " + par);
    }
    var ss = document.getElementsByTagName('span');
    for (var i = 0; i < ss.length; i++) {
        var el = ss[i];
        var cl = el.className;
        if (priceRE.test(cl)) {
            var p = el.innerHTML;
            p = p.replace(/[^0-9\.]/g, '');
            p = parseFloat(p);
            if (!p) continue;
            if (p <= 5) {
                el.style.backgroundColor = 'lime';
            } else if (p <= 7) {
                el.style.backgroundColor = 'yellow';
            } else if (p >= 25) {
                el.style.backgroundColor = 'black';
                el.style.color = 'white';
            }
            var roundUp = Math.floor(p + 0.05);
            if (roundUp > Math.floor(p)) {
                el.innerHTML = '&nbsp;$' + roundUp+'&nbsp;';
            }
        }
    }
}

function register_wm () {
    var as = document.getElementsByTagName('img');
    for (var i = 0; i < as.length; i++) {
        var img = as[i];
        var cn  = img.className;
        GM_log("Saw "+cn);
        if (!(/(prodImg)/.test(img))) 
            continue;
        var cd = codeForElement( img );
        if (!cd) continue;
        if (checkCode( cd[0] )) hideEl( img );
        addEventSimple(img, 'click', checkClick);
        GM_log("Registered "+img);
    }
}

function checkClick (evt) {
    if (evt.shiftKey || evt.altKey) {
        // shift + ctrl = hide this image!
        evt.preventDefault();
        evt.stopPropagation();
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
    evt.stopPropagation();
    return false;
}

function codeForElement (el, vb) {
    if (!el) return null;
    while (el.parentNode && el.tagName != 'A' ) {
        el = el.parentNode;
    }
    if (el.tagName != 'A') {
        if (vb) GM_log("Failed to find anchor "+el);
        return null;
    }
    var href = el.href;
    var code = href.match( getCode );
    if (!code || code.length != 2) return null;
    code = code[1];
    // GM_log(code);
    return [code, el];
}

function checkCode (code) {
    if (!code) return 0;
    return GM_getValue(prfx + code);
}

function hideEl (el) {
    if (!el) return;
    var targ = el;
    while (targ.parentNode && is_not_dvd_object(targ)) {
        targ = targ.parentNode;
    }
    if (is_not_dvd_object(targ)) {
        targ = el;
    }
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

function is_not_dvd_object (el) {
    if (!el) return 1;
    // GM_log(el.tagName);
    if (el.tagName.toLowerCase() != 'li') return 1;
    // GM_log(el.className);
    if (targCl.test(el.className)) return 0;
    var bnt = el.getAttribute('data-bntrack');
    if (bnt) return 0;
    return 1;
}