// ==UserScript==
// @name        Humble Store
// @namespace   tilford.net
// @include     https://www.humblebundle.com/store/*
// @include     https://www.humblebundle.com/store
// @version     1
// @grant       GM_log
// ==/UserScript==

// var iconTest = new RegExp("icon\\s+(\\S+)");
var iconTest  = new RegExp("hb-(linux|osx|gog|windows|steam|drmfree|android|audio|key)");
var otherTest = new RegExp("^\\+[0-9]+$");
var costTest  = new RegExp("(store-price|^price$)");
var metaTest  = new RegExp("^(entity-purchase-details|platform-buy|entity-meta)$");

// console.log("Start : " + iconTest);
schedule(2000);

function schedule (t) {
    window.setTimeout(scan, t);
}

function scan () {
    // var spans = document.getElementsByTagName('span');
    scan_platform(  document.getElementsByTagName('i') );
    // Deal with the new (Summer 2017) "+3" generic OS flags
    scan_platform( document.getElementsByTagName('li') );
    scan_platform( document.getElementsByTagName('span') );
    schedule(5000);

}

function scan_platform (objs) {
    var len  = objs.length;
    for (var i = 0; i < len; i++) {
        var obj = objs[i];
        var cn  = obj.className;
        if (cn) {
            if (is_icon(obj,cn)) continue;
            if (is_price(obj,cn)) continue;
        }
        if (is_other(obj)) continue;
    }
}

function is_icon (obj, cn) {
    var match = cn.match(iconTest);
    if (match != null && match.length > 1) {
        var t = match[1];
        // console.log("Platform Type: " + t);
        return set_plat_type(obj, t);
    }
    return false;
}

function is_other (obj) {
    if (otherTest.test(obj.innerText)) set_plat_type(obj, "other");
}

function set_plat_type (obj, type) {
    par = platform_parent(obj);
    if (par) {
        type = type.toLowerCase();
        if (!par.iconTypes) par.iconTypes = {};
        par.iconTypes[type] = 1;
        markup_system(par);
        return true;
    }
    return false;
}

function platform_parent (obj) {
    while (obj) {
        cn = obj.className;
        if (cn && metaTest.test(cn)) return obj;
        obj = obj.parentNode;
    }
    return null;
}

function markup_system (obj) {
    var color = 'red';
    var types = obj.iconTypes || {};
    if (types['linux']) {
        if (types['drmfree'] || types['gog']) {
            color = 'lime';
        } else {
            color = 'yellow';
        }
    } else if (types['other']) {
        if (types['drmfree'] || types['gog']) {
            color = 'cyan';
        } else {
            color = 'magenta';
        }
    }
    obj.style.backgroundColor = color;
}

function is_price (span, cn) {
    var match = cn.match(costTest);
    if (match == null || match.length == 0) return;
    var cost = span.innerText;
    cost = parseFloat(cost.replace('$',''));
    // console.log("Cost: " + cost);
    var color;
    if (cost <= 4) {
        color = '#f5f';
        span.style.color = 'black';
    } else if (cost >= 20) {
        color = 'black';
    } else if (cost >= 9.5) {
        color = 'gray';
    } else {
        color = 'white';
    }
    if (color) {
        par = span.parentNode;
        if (!par.className) par = par.parentNode;
        par.style.backgroundColor = color;
    }
}

