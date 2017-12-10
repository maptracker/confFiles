// ==UserScript==
// @name           All Recipes TiddlyWiki
// @namespace      tilford.net
// @include        http://allrecipes.com/Recipe/*
// @grant          none
// ==/UserScript==

/* No longer really works after site changes ... */

var tw = {
    ing: new Array(),
    dir: new Array(),
    url: "",
    tit: ""
};

var fold = 1;
var niceFold = 1;
var repl = {
    'teaspoon': 'tsp',
    'tablespoon': 'Tbsp',
    ' degree' : '&amp;deg;',
    'ounce' : 'oz',
};
var replRE = new Object();
for (var old in repl) {
    var out = repl[old];
    replRE[out] = new RegExp(old + 's?', 'gi');
}
init();

function init () {
    // If there is a calculate button, we'll add another button near it
    var links = document.getElementsByTagName('a');
    var ltarg;
    for (var l = 0; l < links.length; l++) {
        var txt = links[l].innerHTML;
        if (/Change Servings/.test(txt)) {
            ltarg = links[l];
            break;
        }
    }
    add_link(ltarg);
}

function add_link ( targ ) {
    if (!targ) return;
    var divs = document.getElementsByTagName('div');
    for (var d = 0; d < divs.length; d++) {
        var div = divs[d];
        if (div.className == 'ingred-left') {
            get_ingredients(div);
        } else if (div.className == 'directions') {
            get_directions(div);
        }
    }
    add_button( targ );
}

function get_ingredients (div) {
    if (!div) return;
    tw.targ = div;
    var lis = div.getElementsByTagName('li');
    var fracRE = /^\s*(\d+)\/(\d+)\s+(.+)/;
    var realRE = /^\s*(\d+\.\d+|\d+)\s+(.+)/;
    for (var l = 0; l < lis.length; l++) {
        var el = lis[l];
        var g  = el.getAttribute('data-grams');
        var iH = el.innerHTML;
        if (g) {
            var gt = " WEIGHT ";
            var rep = '<span id="lblIngName"';
            iH = iH.replace(rep, gt + rep);
        }
        var txt = clean_text(iH);
        var r = txt.match(realRE);
        var num = 0;
        var denom = 1;
        if (r && r[0]) {
            // Leading integer or decimal
            // Need to de-stringify
            num = new Number( r[1] );
            txt = r[2];
        }
        var f = txt.match(fracRE);
        if (f && f[0]) {
            // Leading fractional value
            denom = new Number( f[2] );
            num  *= denom;
            num  += new Number( f[1] );
            txt   = f[3];
        }
        tw.ing.push([num, denom, clean_spaces(txt), g]);
    }
}

function clean_text (txt) {
    // remove any HTML tags
    txt = txt.replace(/<[^>]+>/g, '');
    // remove newlines
    txt = txt.replace(/[\n\r]+/g, ' ');
    // Shorten some units
    for (var out in replRE) {
        txt = txt.replace(replRE[out],out);
    }
    return txt;
}

function clean_spaces (txt) {
    // collapse space runs
    txt = txt.replace(/\s+/g, ' ');
    // remove leading and trailing space
    txt = txt.replace(/^\s+/, '');
    txt = txt.replace(/\s+$/, '');
   return txt;
}

function get_directions (div) {
    if (!div) return;
    var lis = div.getElementsByTagName('li');
    for (var l = 0; l < lis.length; l++) {
        var el = lis[l];
        if (el.id) continue;
        var txt = clean_text(el.innerHTML);
        tw.dir.push(clean_spaces(txt));
    }
}

function add_button ( targ ) {
    if (tw.ing.length == 0 && tw.dir.length == 0) return;
    if (!tw.targ) return;
    // Create the button that will generate the TiddlyWiki markup
    var butt = document.createElement('button');
    tw.butt = butt;
    butt.style.backgroundColor = 'lime';
    butt.innerHTML = 'TiddlyWiki';
    butt.addEventListener('click', function (e) {
            e.preventDefault();
            return show_tw(e);
        } );
    tw.targ.insertBefore(butt, tw.targ.firstChild );
    
}

function show_tw( ) {
    // Generate the TiddlyWiki markup
    var nl  = "<br />\n";
    var txt = "{{ingredients{" + nl;
    for (var i = 0; i < tw.ing.length; i++) {
        txt += '*';
        var num = tw.ing[i][0];
        if (num) {
            var denom = tw.ing[i][1];
            // txt += '['+num+'/'+denom+'] ';
            var val = fold * num / denom;
            if (val < 0.2) {
                val = num + '/' + denom;
            } else {
                val = Math.floor(100 * val) / 100;
                if (/^\./.test(val)) val = '0' + val;
            }
            txt += ' '+val;
        }
        txt += ' ' + tw.ing[i][2] + nl;
        var g = tw.ing[i][3];
        if (g) {
            g = 2 * Math.floor(0.5 + g * fold / 2);
            var gt = g > 10 ? "("+g+" g)" : ""
            var rep = 'WEIGHT';
            txt = txt.replace(rep, gt);
       }
    }
    txt += "}}}{{procedure{" + nl;
    for (var i = 0; i < tw.dir.length; i++) {
        txt += '# ' + tw.dir[i] + nl;
    }
    var titles = document.getElementsByTagName('title');
    if (titles.length == 1) {
        var title = titles[0].innerHTML;
        title = title.replace(/ Recipe -.+/, '');
        var url = document.location + '';
        url     = url.replace('/detail.aspx','');
        txt += '[['+clean_spaces( title )+'|'+url+"]]";
        if (fold != 1) txt += ' //'+niceFold+' recipe//'
        txt += "" + nl;
    }
    txt += "}}}{{clearIt{}}}" + nl;
    var pre = tw.pre;
    if (!pre) {
        var par = tw.butt.parentNode;
        pre = tw.pre = document.createElement('div');
        pre.style.color = 'brown';
        par.insertBefore(pre,tw.butt);
        fold_buttons( par, pre );
        fold_field( par , pre );
    }
    pre.innerHTML = txt ;
    return false;
}

function fold_field (par,pre) {
    var f = document.createElement('input');
    f.type = 'text';
    f.value = fold;
    f.style.width = '2em';
    f.addEventListener('change', function (e) {
            e.preventDefault();
            var nf = e.target.value;
            if (!/^(\d+|\d*\.\d+)/.test(nf)) {
                alert("'"+nf+"' does not look like a number. Please enter a number between 0 (why?) and something large to change the fold factor for the recipe");
                return;
            }
            fold = nf;
            niceFold = nf + 'x';
            return show_tw(e);
        } );
    par.insertBefore(f, pre);
}

function fold_buttons (par, pre) {
    // Create fold multiplier buttons
    var folds = [ 1/3, 1/2, 2/3, 1,2,3,4,5];
    var nice = [ '&frac13;','&frac12;','2/3'];
    for (var fi = 0; fi < folds.length; fi++) {
        var f = folds[fi];
        var fb = document.createElement('button');
        fb.fold = f;
        fb.nice = fb.innerHTML = nice[fi] ? nice[fi] : f + 'x';
        fb.addEventListener('click', function (e) {
                e.preventDefault();
                fold = e.target.fold;
                niceFold = e.target.nice;
                return show_tw(e);
            } );
        par.insertBefore(fb, pre);
    }
}
