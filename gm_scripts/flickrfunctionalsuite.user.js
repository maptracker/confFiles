// ==UserScript==
// @name          Flickr Functional Suite
// @namespace     http://www.tilford.net/
// @description   Adds some additional functionality to page
// @include       http://*.flickr.com/*
// @include       http://flickr.com/*
// @include       https://*.flickr.com/*
// @include       https://flickr.com/*
// @version       1.0.1
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_log
// @grant       GM_xmlhttpRequest
//
// ==/UserScript==



/*
 * This is now very, VERY out of date. Flickr has undergone too many
 * UI changes. Most functionality no longer works.
 *
 */




/*

This is a Grease Monkey script. It *requires* FireFox and the Grease
Monkey extension to work:

http://www.mozilla.com/firefox/
http://greasemonkey.mozdev.org/

Following the instructions on the above web pages
1. Install FireFox
2. Install GreaseMonkey
3. Install this script

Author: Charles Tilford  http://www.flickr.com/photos/charlestilford/
  (I am not hosting tilford.net yet)

This code is released under the CreativeCommons 'By' license. That is,
you can do anything you want with it, just leave my name as one of the
authors. http://creativecommons.org/licenses/by/2.5/

h2. Summary

Provides an interface to let you assign colors to users you meet - that way, if you find a user's link on a page in the future, it will automatically be highlighted with thes color you previously gave them.

In group pool pages, you can highlight user photos where more than one image is visible from the same user. You can also overlay all comments from a user under the corresponding photos on that page.

h2. Features:

# Configuration
** All features can be toggled on / off
** Access to configuration either through [?] links or main "Organize" menu
** Colors can be customized.
# User coloration
** All '/photos/USERNAME/' links will be altered:
*** Clicking on them brings up a mini-menu
*** You can assign a color to any user, which will highlight the user links
*** Colors will be remembered (only on your computer)
*** It is now possible to assign multiple colors to a user
*** Links to their photos, profile and pool images (if in pool page) shown in menu
# Group pool analysis
** When viewing pool pages, all images on the page are tallied
*** Users posting more than one photo will be noted
*** Images from those users will get a colored background
*** Background colors are unique to each user (but otherwise essentially random)
*** Summary of users posting multiple images shown at top of page
** Comments for all photos on a pool page are pre-fetched
*** For any poster on a pool page, all their comments can be shown for other photos on the same page
** NOTE: these functions are off by default, turn them on in the options page ('Organize' Flickr menu)

!http://static.flickr.com/69/206732191_399d74d02a.jpg!:http://www.flickr.com/photos/charlestilford/206732191/

!http://static.flickr.com/73/219349265_b6b41a139b.jpg!:http://www.flickr.com/photos/charlestilford/219349265/

!http://static.flickr.com/90/219349268_a4dd3fa439.jpg!:http://www.flickr.com/photos/charlestilford/219349268/


Handy Color name reference:
http://www.w3.org/TR/2002/WD-css3-color-20020219/#x11-color

!! Caution !!

Persistent data, such as colors assigned to users, are stored within
the Grease Monkey / FireFox system itself. If you invest a lot of time in
color-coding users, you run the risk of losing all your assignments if
FireFox's prefs.js is over-written. If you would like to back up your
assignments, you should back up that file - on Windows it will be
somewhere like:

C:\Documents and Settings\YourUserName\Application Data\
   Mozilla\Firefox\Profiles\8aabdex06.default\prefs.js

and have entries like:

user_pref("greasemonkey.scriptvals.http://www.tilford.net//Flickr Functional Suite.UserColorcharlestilford", "Lime");

!! About User Identifications

Flickr uses a confusing mixture of identifiers for their customers.

Flickr     Used Here Example
---------- --------- -----------------
NSID:      nsid      51159953@N00
username:  uname     listentoreason
photourl:  purl      charlestilford 
displayid: dispid    Truncated Username...

The NSID is the most useful for getting information, but the least
human friendly. The displayid is not technically an official
identifer, but is encountered when parsing Flickr web pages. It is
used when a user name is too long - the username is truncated,
apparently on a whitespace character, and shown with elipses ie "...".

# History
* 25 Aug 2006
** John Carney suggests a Plays-Nice-With-Others alteration that lets pop-up functionality work fine with other GM scripts
** Added additional links in user menu, tried to tighten up real estate usage
* 24 Aug 2006
** Bug fix by John Carney (http://schmickr.innercurmudgeon.com/)
* 19 Aug 2006
** Implemented interface to Flickr API
** Use API to fetch comments for all photos on pool page
*** For any pool contributor, show all of their comments on that page
* 15 Aug 2006
** Allow multiple colors to be assigned to one user
* 6 Aug 2006
** User settings added
*** Can toggle basic behaviors on and off
*** Can now customize color list, and assign description to each color
** Altered 'All Pool Photos' to only display when the low-level ID is used as the UID
* 4 August 2006
** Nice interface to set user color
** User colors persistently stored with GM_setValue()
** Multiple posting working well
** The 'All Pool Photos' usually will not work - I need to implement a method to ajax get the low-level user ID

 !! Disclaimer !!

Feel free to mine the code for ideas, but be warned that because this
is a Grease Monkey script, I have made no effort at all to make the code
anywhere close to cross-browser compatible - parts of the code will be
specific to FireFox and will not function in other browsers.

Boy it is *nice* to develop JS for *ONLY* FireFox!

*/


var CatFlickrSuite = {
    // Internal data structures
    privateData: new Object(), // Safe (?) storage of metadata for DOM elements
    env:         new Object(), // Global environmental values
    user:        new Object(), // user-defined values
    doneTask:    new Object(), // Prevent re-fetching some data
    gmMsg: "",                 // Debugging message buffer
    apikey: "b1c88b6a99ffabbf76ace9eab025996f",
    seckey: "79c1cc27f6c7cff9",
    objects: {  }, // Pre-calculated/scanned
    // Sigh. Flickr is changing their object IDs. Their perogative, of course
    // Centralize the IDs here to make code updates easier
    fids: {
        main: 'main',
        navYou: 'flickr_nav_menu_you',
        //        navOrg: 'flickr_nav_menu_organize',
        navOrg: 'explore-panel',
        csfHelp: 'CfsHelpButton',
        csfCols: 'currentColors',
        csfAvl:  'availableColors',
        csfPop:  'CatFlickrSuitePopUp',
        csfTag:  'CFS_Tag_Assoc',
        grpAvl:  'TagMatchAvail'
    },
    // User configurable parameters. Organized by class (the kind of
    // <input> used to represent them) and parameter name, with a
    // description and default value for each.
    userSet: {
        checkbox: {
            colorUser: ["Colorize user IDs",1],
            colorMult: ["Colorize multiple images from same user in group pools",0],
            sumMult:   ["Summarize multi-posters in group pools",0],
            getCom:    ["Pre-fetch all comments associated with photos on a pool page",0],
        },
        text: {
            comWidth:  ["Maximum characters to show for in-line comments",100],
            comSize:   ["Inline comment font size", '9px'],
        },
        textarea: {
            UserColors: ["Colors and descriptions for tagging other users",
                         "Lime Category 1\nAqua Category 2\nFuchsia Category 3\nSilver Category 4\nYellow Category 5\nRed Category 6\nBlack Category 7\nNone"],
        },
    },
    translate: { },
    // The 'minimum RGB spacing' - prevents grays when using string2color and color4string:
    colBuf: 64,
    /* colMin and colMax added for @decembre. Allows the RGB index
       range in pools to be changed from 0-255 to user prefs.
       colMin - increase to prevent 'dark' index values
       colMax - decrease to prevent 'light' index values
       ALWAYS have colMin < colMax, and both between 0 and 255 */
    colMin: 0,
    colMax: 255,
    counter: 0,
    ticket: 0,
    ticketStatus: new Object(),
    // Special links that we want to ignore:
    specialLinks: ['1', '< Prev', 'You', 'Organize', 'Upload', 'upload',
                   'Popular Tags','Organize & Create', "All your content",
                   'Upload Photos and Videos', "Your Photostream",
                   'Your Photos', 'Upload Photos', 'All your photos', ],
    re: {
        // Regular Expression Collection
        frob:       /\?frob=(\S+)$/,             // Authentication frob
        photoID:    /\/photos\/([^\/]+)\/(\d+)/, // PURL and Photo ID
        userPhotos: /\/photos\/([^\/]+)\/$/,     // Link to user photots
        myComs:     /\/photos_comments\.gne/,    // Comments you made
        urlPool1:   /\/([^\/]+)\/pool\//,        // Group pool href
        urlPool2:   /\/in\/pool-([^\/]+)\//,     // Image in pool stream
        urlGroup:   /\/groups\/([^\/]+)\//,      // General group URL
        urlAllGrp:  /\/groups\/?$/,               // Group list page
        statRef:    /\/stats\/([^\/]+)\//,       // Statistics page
        urlSet:     /\/photos\/([^\/]+)\/sets\/(\d+)\/?$/, // Photoset
        elipsed:    /\.\.\.$/,                   // Trailing 3 periods (elipses)
        nsid:       /^\d+\@.{3}$/, // Not sure what the real format is?
        organize:   /\/photos\/organize\//,      // Organize DHTML interface
    },
    init: function() {
        // The primary initialization function
        // console.log("Starting: " + new Date());
        var now = new Date();
        this.ms = now.getTime().toString();
        this.setEnvironment();
        if (this.env.pageType == 'Organize') return; // Do nothing on Organize
        this.initTransmute();
        this.setSettings();
        this.insertSettings();
        this.refresh();
        this.annotateGroupList();
        this.tagAssociation();
        this.cleanComments();
        this.colorStats();
        this.finalize();
        console.log("Initialized Flickr Functional Suite");
        window.addEventListener('click', function (e) {
                // alert('new data!');
                CatFlickrSuite.checkClickEvent(e);
            }, false);

        //window.addEventListener('AutoPagerNewData', function (e) {
        //        document.CatFlickrSuite.refresh();
        //    }, false);
    },
    refresh: function() {
        this.grabFrob();
        this.armLinks();
        this.findMultiPost();
        this.colorUserPhotos();
        this.getAllComments();
    },
    whoami: function() {
        if (this.you == null) {
            var data = this.parseFlickrData();
            this.you = "";
            if (data.flickr && data.flickr.user && data.flickr.user.pathalias) {
                this.you = data.flickr.user.pathalias;
            } else {
                console.log("Could not find path alias");
            }
        }
        return this.you;
    },
    myNSID: function() {
        if (this.nsid == null) {
            var data = this.parseFlickrData();
            this.nsid = 0;
            if (data.flickr && data.flickr.user && data.flickr.user.nsid) {
                this.nsid = data.flickr.user.nsid;
            } else {
                console.log("Could not find NSID");
            }
        }
        return this.nsid;
    },
    parseFlickrData: function () {
        if (!this.yconf) {
            var nodes = document.getElementsByTagName('script');
            for (var n=0; n<nodes.length; n++) {
                var html = nodes[n].innerHTML;
                if (!html) continue;
                var hits = html.match(/\s*var\s+yconf\s+=\s*(\{.+?\})\;\s*/);
                if (hits) {
                    this.yconf= JSON.parse( hits[1]);
                    break;
                }
            }
            if (!this.yconf) {
                this.yconf = new Object();
                console.log("Failed to find Flickr yconf hash object");
            }
        }
        return this.yconf;
    },
    groupID: function() {
        if (this.groupid == null) {
            this.groupid = 0;
            var nodes = document.getElementsByTagName('link');
            for (var n=0; n<nodes.length; n++) {
                if (!nodes[n] || !nodes[n].href) continue;
                var hits = nodes[n].href.match(/groups_[a-z]+\.gne\?.*id=([^\&]+)/);
                if (hits) { this.groupid = hits[1]; break; }
            }
            if (!this.groupid) {
                // Try links
                nodes = document.getElementsByTagName('a');
                for (var n=0; n<nodes.length; n++) {
                    if (!nodes[n] || !nodes[n].href) continue;
                    var hits = nodes[n].href.match(/groups_[a-z]+\.gne\?.*id=([^\&]+)/);
                    if (hits) { this.groupid = hits[1]; break; }
                }
            }
        }
        return this.groupid;
    },
    setEnvironment: function() {
        // Gather some global information
        var href = this.env.href = document.location.href;
        var mat;
        this.env.pageType = this.env.pageView = '';
        // Are we on the organize page?
        mat  = href.match(this.re.organize);
        if (mat) { this.env.pageType = 'Organize'; 
        this.env.pageView = 'Organize'; return; }
        // Are we on a 'Comments you've made' page?
        mat  = href.match(this.re.myComs);
        if (mat) { this.env.pageType = 'Comment'; 
        this.env.pageView = 'YourComments'; return; }
        // Are we on a Group's pool page?
        // See if we are in a group pool-related page:
        mat  = href.match(this.re.urlPool1);
        if (mat) { this.env.group = mat[1]; 
        this.env.pageType = 'Group'; this.env.pageView = 'Pool'; return; }

        // Group list page
        mat  = href.match(this.re.urlAllGrp);
        if (mat) { this.env.group = mat[1]; 
            this.env.pageType = 'Group'; this.env.pageView = 'YourGroups'; return; }

        // Generic URL for groups:
        mat  = href.match(this.re.urlGroup);
        if (mat) { this.env.group = mat[1]; 
        this.env.pageType = 'Group'; return; }
        // A photoset page:
        mat  = href.match(this.re.urlSet);
        if (mat) { this.env.setOwn = mat[1]; this.env.set = mat[2];
        this.env.pageType = this.env.pageView = 'Set'; return; }
        // Statistics Page
        mat  = href.match(this.re.statRef);
        if (mat) { 
            this.env.statType = mat[1];
            this.env.pageType = this.env.pageView = 'Stats'; return;
        }
       
    },
    initTransmute: function() {
        // Turn one object type into another This just allows
        // representation of some data structures in a format that is
        // easy for humans to modify, but not the ultimate structure
        // needed by the code.
        this.specLinkHash = new Object();
        for (var i=0; i<this.specialLinks.length;i++) {
            this.specLinkHash[this.specialLinks[i].toLowerCase()] = 1; 
        }
        // Flatten settings hash into 2D array
        var uarr = new Array();
        for (var type in this.userSet) {
            // Cycle through each data type
            var info = this.userSet[type];
            for (var tag in info) {
                // Cycle through each parameter
                var subarray = [ type, tag ];
                // Add description, defaultValue:
                subarray = subarray.concat( info[tag] );
                uarr.push(subarray);
            }
        }
        this.msg();
        this.userSetArr = uarr;
    },
    setSettings: function() {
        // Scan all configurable tagnames and retrieve value from
        // GreaseMonkey internal store, or set to default value.
        var uarr = this.userSetArr;
        for (var u=0; u < uarr.length; u++) {
            var tag        = uarr[u][1];
            var def        = uarr[u][3];
            this.user[tag] = GM_getValue(tag, def);
        }
        // Special processing of user colors
        var colArr = this.user.UserColors.split(/[\r\n]+/);
        this.user.colList = new Array();
        this.user.colDesc = new Object();
        for (var c=0;c<colArr.length;c++) {
            var cbits = colArr[c].split(/\s+/);
            var cname = cbits.shift();
            if (!cname || cname == '') continue;
            var cdesc = cbits.join(' ');
            this.user.colList.push(cname);
            this.user.colDesc[ cname.toLowerCase() ] = cdesc;
        }
    },
    msg: function() {
        // Record some debugging information. These messages will
        // appear in the FireFox javascript Console, under 'Messages'
        if (this.gmMsg != "") console.log("Execution messages:\n"+this.gmMsg);
        this.gmMsg = "";
    },
    err: function (msg, e) {
        // Throw an error, also to the JS concole
        if (e) {
            if (e.description) msg += "\n  DESC: " + e.description;
            msg += "\n  ERR: " + e;
        }
        console.log(msg);
    },
    finalize: function() {
        // Final code to execute after all parsing is done.
        this.msg();
    },
    armLinks: function() {
        // Search for <a> tags on the page that we want to modify
        var links = this.liveUserPhotoList();
        for (var i=0; i < links.length; i++) {
            this.registerUserPhoto( links[i] );
        }
    },
    colors4user: function(purl, asArray) {
        // Get your color(s) for a particular PURL
        // asArray = return array, otherwise return hash
        var rv = asArray ? new Array() : new Object();
        var cstr = GM_getValue("UserColor"+purl);
        if (!cstr) return rv;
        // Split string on spaces
        var clist = cstr.split(/\s+/);
        for (c=0; c < clist.length; c++) {
            var cname = clist[c].toLowerCase();
            if (!cname || cname == 'none') continue; // compatibility with old versions
            if (asArray) {
                rv.push(cname);
            } else {
                rv[cname] = clist[c];
            }
        }
        return rv;
    },
    userPhotoClick: function(el, evt) {
        if (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            console.log(evt);
            evt.returnValue = false;
        }
        // Establish the new pop-up menu that will be used for "/photos/UserName/" links:
        // console.log(el.id + ' from ' + this.ms);
        var dispid    = this.registerUserPhoto(el);
        var uname     = this.getTranslation(dispid, 'uname');
        var purl      = this.getTranslation(dispid, 'purl');
        var nsid      = this.getTranslation(dispid, 'nsid');
        var colHash   = this.colors4user( purl );
        // console.log("User click on "+el.id+" ("+el+") = "+dispid);
        // Close box and name:
        var html = "<span class='CancelButt'>[x]</span>&nbsp;<b>"+
        (uname ? uname : dispid)+
        "</b>&nbsp;<span style='color:green;cursor:help' id='"+
        this.fids.csfHelp+"'>[?]</span>\n<div id='currentColors'>";
        for (var ucol in colHash) {
            html += this.userColorBlock( colHash[ucol], 'SetColor' );
        }
        html += "</div>\n";

        // Each 'item' is a line in the popup - see makeMenu()
        var items = new Array();
        var links = new Array();
        // This is what the link used to point to:
        links.push( ['Photos', "/photos/"+purl+"/" ] );
        // Add in the user's profile, favorites, sets and tags:
        links.push( [ 'Profile', "/people/"+purl+"/" ] );
        links.push( [ 'Favorites', "/photos/"+purl+"/favorites/"] );
        // links.push( [ 'Archive', "/photos/"+purl+"/archives/"] );
        links.push( [ 'Sets', "/photos/"+purl+"/sets/"] );
        links.push( [ 'Tags', "/photos/"+purl+"/tags/"] );
        if (nsid) {
            links.push( ['Mail', "/messages_write.gne?to="+nsid]);
        }
        if (this.env.pageView == 'Pool') {
            // We are on a pool-related page
            if (nsid) links.push ( ['All Pool Photos', '/groups/'+this.env.group+'/pool/'+nsid]);            if (uname && this.objects.comments) {
                // Pre-computed comments are available
                if (this.objects.comments[uname]) {
                    // We found at least one comment for this user
                    var coms = this.objects.comments[uname];
                    var cn   = coms.length;
                    var cmag = {href: "javascript:void(0)", 'class': 'ShowComments', text: ctxt};
                    var ctxt = (this.objects.shownComments[uname] ? 'Hide ' : 'Show ') + cn;
                    ctxt    += " comment"+(cn == 1 ? '' : 's')+ " on this page";
                    cmag.text = ctxt;
                    items.push(cmag);
                } else {
                    // No comments for this user
                    items.push("<i>No comments found</i>");
                }
                // Are the AJAX requests succesfully completed?
                var stat = this.apiStatus('getComments');
                if (stat != "") {
                    // Warn the user that some data was not available.
                    items.push({ tag:'i', style:'color:orange; font-size:xxsmall', text:"&rArr;Data missing: "+stat})
                }
            }
        }
         if (uname) {
            // John Watson's Scout page - list of the user's interesting photos
            links.push
                ( [ 'Scout', "http://flagrantdisregard.com/flickr/scout.php?username="+uname] );
            // Nathan Siemer's HiveMind
            links.push
            ( [ 'HiveMind', "http://flickrhivemind.net/User/"+uname] );
        }
        if (links.length > 0) {
            // The number of links to stuff into one line:
            var linksPerLine = 3;
            for (var l=0;l<links.length; l++) {
                html += "| <a class='simple_butt' href='"+links[l][1]+"'>"+links[l][0]+"</a> ";
                if (!((l+1) % linksPerLine)) html += "|</br>"; 
            }
            if (links.length % linksPerLine) html += "|</br>";
        }
        // Make a menu of colors to list:
        items.push({ tag:'b', text: 'Available Flags:' });

        html += this.makeMenu( items ) +"\n<div style='font-size:smaller' id='"
        + this.fids.csfAvl + "'>";
        for (var c=0; c < this.user.colList.length; c++) {
            var col   = this.user.colList[c];
            if (colHash[col.toLowerCase()]) continue;
            var linkHtml = this.userColorBlock( col, 'SetColor' );
            if (linkHtml != "") html += linkHtml;
        }
        html += "</div>\n";

        // Pop up the window
        var div = this.popUp(el, html, evt);
        // Also associate the PURL with the popup, we'll need it for processing clicks later
        var hb = document.getElementById(this.fids.csfHelp);
        if (hb) hb.addEventListener('click', function (e) {
            return CatFlickrSuite.settingsClick(this, e);}, false);
        this.privateHash(div, 'purl', purl);
        this.privateHash(div, 'dispid', dispid);
        this.privateHash(div, 'onclose', function() {
                CatFlickrSuite.updateUser( el );
            } );
        console.log("DEBUG="+el.href);
        return false;
    },
    userColorBlock: function(col, cname) {
        // Returns a single div for a category color
        if (/^none$/i.test(col)) return ""; // compatibility with old versions
        // Get the description for this color:
        var text  = this.user.colDesc[col.toLowerCase()];
        // Use the color name itself if no description available:
        if (!text) text = col;
        return this.makeMenu( [ {
            tag: 'div', 'class':cname, text: "<em>"+text+"</em>", colName: col, style: "background-color:"+col
        } ] );
    },
    escapeXML: function (txt) {
        if (txt == null) return '';
        txt = txt.replace(/&gt;/g,'>');
        txt = txt.replace(/&lt;/g,'<');
        txt = txt.replace(/&amp;/g,'&');
        return txt;
    },
    unescapeXML: function (txt) {
        if (txt == null) return '';
        txt = txt.replace(/\>/g,'&gt;');
        txt = txt.replace(/\</g,'&lt;');
        txt = txt.replace(/\&/g,'&amp;');
        return txt;
    },
    liveUserPhotoList: function () {
        /* Designed to always return a list of user photos, even
           if the page has been modified by another script */
        var arr = new Array();
        var links = document.getElementsByTagName("a");
        for (var l=0; l < links.length; l++) {
            var el = links[l];
            if (this.isUserPhoto(el)) arr.push(el);
        }
        return arr;
    },
    isUserPhoto: function (el) {
        if (!el) return false;
        var dispid  = el.text;
        // Skip special links:
        if (dispid == null || dispid == '' || this.specLinkHash[dispid.toLowerCase()] ||
            /photostream$/.test(dispid)) return false;
        var hit  = el.href.match( this.re.userPhotos );
        if (!hit) return false;
        return hit[1];
    },
    colorUserPhotos: function (purlReq) {
        if (this.user.colorUser != 1) return;
        // This routine colors <a> tags pointing to
        // "/photos/UserName/", so long as you have assigned a color
        // to that particular user. If purlReq is null, then all links
        // are processed, otherwise only the requested purl will be
        // altered.
        var arr = this.liveUserPhotoList();
        this.gmMsg += "Coloring User photos for '"+purlReq+"' out of " +arr.length+" total images\n";
        for (var i=0; i < arr.length; i++) {
            var el     = arr[i];
            // if (this.privateHash(el, 'cupDone')) continue;
            this.privateHash(el, 'cupDone', true);
            var purl   = this.privateHash(el, 'purl');
            // Skip if there is a specific request and this is not it
            if (purlReq && purl != purlReq) continue;
            // this.gmMsg += "Coloring "+purl+"\n";
            var colArr  = this.colors4user( purl, true );
            var colNum  = colArr.length;
            var text    = this.privateHash(el, 'innerText');
            var htmlNow = el.innerHTML;
            if (colNum < 1) {
               // Decolorize the link if it was previously colored:
                if (text) el.innerHTML = htmlNow.replace(/\<span[^\>]+span\>/,'');
                continue;
            }
            if (!text) {
                text = this.unescapeXML(el.text);
                this.privateHash(el, 'innerText', text);
            }
            // The routine below will color the user's name into one or more colored blocks:
            var tlen   = text.length;
            var step   = tlen / colNum;
            var html   = "";
            for (var c=0; c < colNum; c++) {
                var start = Math.floor(0.5 + c * step);
                var end   = (c == colNum - 1) ? tlen : Math.floor(0.5 + (c+1) * step);
                if (start == end) continue;
                html += "<span style='background-color:"+colArr[c]+"'>"+
                    this.escapeXML(text.substring(start, end)) + "</span>";
            }
            if (/\<span/.test(el.innerHTML)) {
                el.innerHTML = htmlNow.replace(/\<span.+span\>/, html);
            } else {
                el.innerHTML = htmlNow.replace(text, html);
            }
        }
        this.msg();
    },
    tagAssociation: function () {
        var main  = document.getElementById(this.fids.main);
        if (!main) return;
        var type = this.env.pageType;
        if (type == 'Set') {
            // Only associate with sets you own
            var you   = this.whoami();
            var owner = this.env.setOwn;
            if (!owner || !you || owner != you) return;
        } else if (type != 'Group') {
            return;
        }
        var div = document.getElementById(this.fids.csfTag);
        if (!div) {
            // Make the div if we have not already done so
            div = document.createElement('div');
            div.id = this.fids.csfTag;
            main.insertBefore(div, main.firstChild);
            div.style.border = 'solid navy 1px';
        }
        var tags = new Array();
        var hash = this.getTagAssociations(  );
        for (var tag in hash) {
            if (tag && tag != '') tags.push( tag );
        }
        var html = "";
        var form = document.createElement('form');
        form.innerHTML = "<i>Associate tag rule with this "+type+":</i> "+
        "<input name='tagassoc' width='20' value='' />";
        div.innerHTML = html;
        div.appendChild(form);
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            return CatFlickrSuite.addTagAssociation(this);}, false);
        if (tags.length != 0) {
            var tform = document.createElement('form');
            var thtml = "<input type='submit' id='cfs_ta_search' value='Find new members with tag:'>";
            tags = tags.sort();
            for (var t=0; t < tags.length; t++) {
                var tag = tags[t];
                thtml += "<span style='border: grey solid 1px; margin: 3px; padding: 3px;'><input type='checkbox' name='cfs_ta' value='"+tag+
                    "' checked='checked'/>"+hash[tags[t]] +" <span class='CancelButt'>[x]</span></span> ";
            }
            var lim = GM_getValue("TagAssocLimit", '');
            thtml += "<br /><span style='color: #006'>";
            thtml += "Report at most <input id='cfs_ta_limit' size='3' value='"+lim+
                "' /> matches";
            thtml += ", uploaded between <input id='cfs_ta_minage' size='3' />";
           thtml += " to <input id='cfs_ta_maxage' size='3' /> days ago";
            thtml += "</span>\n";
            tform.innerHTML = thtml;
            div.appendChild(tform);
            // Monitor tag interactions:
            tform.addEventListener('click', function (e) {
                return CatFlickrSuite.tagAssocClickHandler(e);}, false);
        }
        this.taDiv = div;
    },
    intFromField: function( fieldId, desc, errors) {
        var obj = document.getElementById( fieldId);
        if (!obj) return null;
        if (/^\d+$/.test(obj.value)) return obj.value;
        if (desc && errors) errors.push(desc);
        return null;
    },
    UTC: new Date(1970,0,1),
    flickrDateFormat: function( offset ) {
        if (!offset) offset = 0;
        var dt = new Date();
        dt.setDate(dt.getDate() - offset);
        return (dt.getTime() - this.UTC.getTime()) / 1000 ;
        return dt.toUTCString();

        var string = dt.getFullYear();
        var bits   = [ dt.getMonth() + 1, dt.getDate(),
                       dt.getHours(), dt.getMinutes(), dt.getSeconds() ];
        for (var b=0; b < bits.length; b++) {
            var val = bits[b];
            if (val < 10) val = '0' + val;
            string += val;
        }
        return string;
    },
    gmObjId: function () {
        var type = this.env.pageType.toLowerCase();
        if (!type || type == '' || !this.env[type] ) return '';
        return type + '_' + this.env[type];
    },
    getTagAssociations: function() {
        var hash = new Object();
        var gid  = this.gmObjId();
        if (gid == '') return hash;
        var txt = GM_getValue("TagAssoc_"+gid, '');
        var words = txt.split(',');
        for (var w=0; w < words.length; w++) {
            var raw = words[w];
            hash[ this.cleanTag(raw) ] = raw;
        }
        return hash;
    },
    setTagAssociations: function(hash) {
        var gid  = this.gmObjId();
        if (!hash || gid == '') return 0;
        var arr = new Array();
        for (var tag in hash) {
            if (tag && tag != '') arr.push(hash[tag]);
        }
        arr = arr.sort();
        GM_setValue("TagAssoc_"+gid, arr.join(','));
        return arr.length;
    },
    addTagAssociation: function (el) {
        var val = this.valuesForNamedInput(el, 'tagassoc');
        if (!val || val.length != 1 || ! val[0]) return;
        var raw  = val[0];
        var tag  = this.cleanTag(raw);
        var hash = this.getTagAssociations();
        hash[ tag ] = raw;
        this.setTagAssociations(hash);
        // Redraw the interface
        this.tagAssociation();
    },
    tagAssocClickHandler: function(e) {
        // Respond to a click event in a tag list
        if (!e || !e.originalTarget) return;
        var targ  = e.originalTarget;
        var cn, id;
        try {
            // For some reason this throws a Permission Denied sometimes
            cn = targ.className;
            id = targ.id;
        } catch (e) {
            this.err("Failed to find node information for "+targ, e);
        }
        if (cn == 'CancelButt') {
            var el    = targ.parentNode.firstChild;
            if (!el || !el.value) return;
            var raw  = el.value;
            var hash = this.getTagAssociations();
            delete hash[ this.cleanTag(raw) ];
            this.setTagAssociations(hash);
            this.tagAssociation(); // Redraw the interface
        } else if ( id == 'cfs_ta_search' ) {
            e.preventDefault();
            this.searchTagAssociations();
        }
    },
    cleanTag: function (raw) {
        // "Hot Dog" !cat rat !"My Mouse"
        // leading exclamation point
        if (raw == null) return '';
        var tag = raw.toLowerCase();
        tag = tag.replace(/\s+/g, ' ');   // Space runs trimmed to single spaces
        tag = tag.replace(/\! /g, '!');   // Remove trailing space after !
        var tagList = new Array();
        // Identify and extract contents of quoted strings
        var quotes  = [ "'", '"' ];
        for (var q = 0; q < quotes.length; q++) {
            var qt = quotes[q];
            // Make sure ! is inside quotes:
            var swRE   = new RegExp('!' + qt, 'g');
            tag        = tag.replace(swRE, qt + '!');
            var nestRe = new RegExp(qt+ '([^' + qt + ']+)' + qt);
            while (1) {
                var quoted = tag.match( nestRe );
                if (!quoted || quoted.length < 2) break;
                var inner = quoted[1];
                // Check for leading !
                var isNot = /^\!/.test(inner) ? '!' : '';
                inner     = inner.replace(/[^a-z0-9]/g, '');
                tagList.push( isNot + inner );
                tag = tag.replace(quoted[0],'');
            }
        }
        tag = tag.replace(/^\s+/, '');   // Remove leading space
        tag = tag.replace(/\s+$/, '');   // Remove trailing space
        var words = tag.split(/\s+/);
        for (var w = 0; w < words.length; w++) {
            var word  = words[w];
            var isNot = /^\!/.test(word) ? '!' : '';
            word     = word.replace(/[^a-z0-9]/g, '');
            tagList.push( isNot + word );
        }
        // console.log("Raw: "+raw+" | Parsed: "+tagList.join(' '));
        return tagList.join(' ');
    },
    searchTagAssociations: function () {
        var cbs  = document.getElementsByName('cfs_ta');
        if (!cbs || cbs.length < 1) return;
        var type = this.env.pageType;
        var ta   = this.tagAssocResults = { shown: {}, shownum: 0 };
        var nsid = this.myNSID();
        if (!nsid) {
            alert("Failed to determine your Flickr NSID for searching");
            return;
        }
        var commonFlickrArgs = { 
            method: 'flickr.photos.search', user_id: nsid, per_page: 500, extras: 'icon_server'
        };

        var atErr = new Array();
        var minA  = this.intFromField('cfs_ta_minage', "minimum age", atErr);
        var maxA  = this.intFromField('cfs_ta_maxage', "maximum age", atErr);
        if (minA && maxA && minA > maxA) {
            var tmp = minA;
            minA    = maxA;
            maxA    = tmp;
        }
        if (minA) {
            commonFlickrArgs.min_upload_date = this.flickrDateFormat( minA );
        }
        if (maxA) {
            commonFlickrArgs.max_upload_date = this.flickrDateFormat( maxA );
        }
        // console.log("Date range: "+commonFlickrArgs.min_upload_date + ' to ' + commonFlickrArgs.max_upload_date);

        if (type == 'Set') {
        } else if (type == 'Group') {
            commonFlickrArgs.privacy_filter = 1; // Assume we want only public photos for groups
        } else {
            alert("I do not know how to find photos for a '"+type+"' page");
            return;
        } 
        ta.what = type;

        // Determine which tag criteria the user wants to use to find photos
        var tagCriteria = new Object();
        for (var c=0; c < cbs.length; c++) {
            // Scan through all the user's tag criteria defined for this set / pool
            var cb = cbs[c];
            if (!cb.checked) continue; // Not selected for this search
            // Each criteria should have one or more tags in it
            var tagSet  = cb.value.split(' ');
            
            var crit    = { tags: [], not: [] };
            var goodTag = 0;
            for (var ts = 0; ts < tagSet.length; ts++) {
                var tag = tagSet[ts];
                if (!tag) continue;
                if (/\!/.test(tag)) {
                    // This is a 'not' tag
                    crit.not.push( tag.replace(/\!/g, '') );
                } else {
                    crit.tags.push( tag );
                }
                goodTag++;
            }
            if (goodTag == 0) continue;
            // Use the not requests to aggregate each criteria
            crit.not.sort();
            var nkey = crit.not.join(' ') || '';
            if (!tagCriteria[ nkey ]) {
                tagCriteria[ nkey ] = {
                    'not': crit.not,
                    'and': new Array(),
                    'or':  new Array(),
                };
            }
            var posTags = crit.tags;
            if (posTags.length == 1) {
                // Single positive tag request, put it in an OR stack
                tagCriteria[ nkey ].or.push( posTags[0] );
            } else if (posTags.length > 1) {
                tagCriteria[ nkey ].and.push( posTags.join(',') );
            }
        }

        var searchArgs = new Array();
        for (var nkey in tagCriteria) {
            var crit      = tagCriteria[ nkey ];
            var orLen     = crit.or.length;
            var andLen    = crit.and.length;
            var notLen    = crit.not.length;
            if (orLen + andLen + notLen == 0) continue; // We need at least one criteria...
            var notHash;
            if (notLen) {
                // There is a least one tag we should exclude
                notHash = new Object();
                for (var n = 0; n < notLen; n++) {
                    notHash[ crit.not[n] ] = 1;
                }
            }

            var flickArgs = new Object();
            for (var cfa in commonFlickrArgs) {
                // Make a copy of the common arguments hash:
                flickArgs[ cfa ] = commonFlickrArgs[cfa];
            }

            var notQuery  = "";
            if (notLen) {
                // We will need to know the tags for each photo in order to exclude them
                flickArgs.extras = flickArgs.extras + ',tags';
                if (orLen || andLen) {
                    // The NOT query is going to be combined with other positive criteria
                    notQuery = " <span style='font-weight:bold; color:red'>but NOT</span> " +
                        "<u>" + crit.not.join('</u> <b>OR</b> <u>') + "</u>";
                } else {
                    // This is simply an exclusionary criteria
                    searchArgs.push( [ flickArgs, { 
                        ticktype: 'tagAssoc', search: 'tags', not: notHash,
                                      query: "<span style='font-weight:bold; color:red'>NOT</span> " +
                                      "<u>" + crit.not.join('</u> <b>OR</b> <u>') + "</u>"} ] );
                }
            }
            if (orLen) {
                // Request to do an OR tag search
                // We need to locally copy the hash again
                var flickArgsCopy = new Object();
                for (var fa in flickArgs) {
                    flickArgsCopy[fa] = flickArgs[ fa ];
                }
                flickArgsCopy.tags     = crit.or.join(',');
                flickArgsCopy.tag_mode = 'any';
                searchArgs.push( [ flickArgsCopy, { 
                        ticktype: 'tagAssoc', search: 'tags', not: notHash,
                                      query:  "<u>" + crit.or.join('</u> <b>OR</b> <u>') +"</u>"+ notQuery }] );
            }
            if (andLen) {
                // Request to do one or more AND tag searches
                for (var ca = 0; ca < andLen; ca ++) {
                    // We need to locally copy the hash again
                    var flickArgsCopy = new Object();
                    for (var fa in flickArgs) {
                        flickArgsCopy[fa] = flickArgs[ fa ];
                    }
                    flickArgsCopy.tags     = crit.and[ca];
                    flickArgsCopy.tag_mode = 'all';
                    searchArgs.push( [ flickArgsCopy, { 
                        ticktype: 'tagAssoc', search: 'tags', not: notHash,
                                      query: "<u>" + crit.and[ca].split(',').join('</u> <b>AND</b> <u>') +"</u>"+ notQuery } ] );
                }
            }
        }
        var numSearch = searchArgs.length;
        if (numSearch == 0) {
            alert("You need to select at least one tag to perform a search");
            return;
        }

        // At least one valid set of criteria
        // Add the search to find pre-existing photos
        if (type == 'Set') {
            var sid = this.env.set;
            if (!sid) { alert("Unable to determine the Set identifier"); return; }
            searchArgs.push( [ 
                { method: 'flickr.photosets.getPhotos', photoset_id: sid },
                { ticktype: 'tagAssoc', search: 'photoset' } ] );
        } else if (type == 'Group') {
            var gid = this.groupID();
            if (!gid) { alert("Failed to find Flickr Group ID"); return }
            searchArgs.push( [
                { method: 'flickr.groups.pools.getPhotos', per_page: 500, user_id: nsid, group_id: gid },
                { ticktype: 'tagAssoc', search: 'photos' } ] );
        }

        // Set up a DIV for output:
        var resID = 'cfs_tag_search_results';
        var targ  = document.getElementById( resID );
        if (targ) {
            targ.innerHTML = "";
        } else {
            targ = document.createElement('div');
            targ.id = resID;
            this.taDiv.appendChild(targ);
        }
        ta.resultsDiv = targ;

        // Parse the limit value
        ta.limit  = 0;
        ta.limit  = this.intFromField('cfs_ta_limit', "search limit", atErr);
        if (ta.limit) GM_setValue("TagAssocLimit", ta.limit);

        
        // launch all Flickr API searches:
        for (var sa = 0; sa < searchArgs.length; sa++) {
            var div = document.createElement('div');
            var qry = searchArgs[sa][1].query;
            if (qry) {
                qry = "with tags " + qry;
            } else {
                qry = "already present in the " + type;
            }
            div.innerHTML = "<i>Searching for your photos "+qry+"</i>";
            targ.appendChild(div);
            searchArgs[sa][1].div = div;
            this.flickrApi( searchArgs[sa][0], 'tagAssocCB', searchArgs[sa][1] );
        }
        // The callback (tagAssocCB, below) will perform the subtraction of [Present - Needed]
    },
    tagAssocCB: function(rsp, args, cfsArgs) {
        // This function captures and combines two Ajax calls
        var st   = cfsArgs.search;
        var ta   = this.tagAssocResults;
        if (ta.complete) return;
        var targ = ta.resultsDiv;
        var qDiv = cfsArgs.div;
        var type = ta.what;
        if (st == 'tags') {
            // This query is reporting photos matching the user's tag criteria
            var notHash = cfsArgs.not;
            var keeping = new Array();
            
            for each (photos in rsp.photos) {
                for each (photo in photos.photo) {
                    if (notHash) {
                        // We need to verify that the photo does not have an excluded tag
                        var notCount = 0;
                        var tags = photo['@tags'].split(' ');
                        for (var t = 0; t < tags.length; t++) {
                            if (notHash[ tags[t] ]) { notCount++; break; }
                        }
                        // If any of the excluded tags match, then do not use the photo
                        if (notCount) continue;
                    }
                    var pid = photo['@id'];
                    keeping.push( { id: pid, title: photo['@title'], src: 'http://static.flickr.com/'+
                                            photo['@server']+'/'+pid+'_'+photo['@secret']+'_s.jpg'} );
                }
            }
            if (!ta.results) ta.results = new Array();
            var rdat = { photos: keeping, args: cfsArgs };
            ta.results.push( rdat );
            var numMatched = keeping.length;
            var nstyle     = 'color: blue;';
            if (numMatched == 0) {
                rdat.done = 1;
                nstyle = 'color: red;';
            }
            qDiv.innerHTML = "<b style='"+nstyle+"'>" + numMatched + "</b> photo"+
                (numMatched == 1 ? ' matches ' : 's match ') + cfsArgs.query;
        } else {
            // This query is reporting photos already in the set / pool
            var numExisting = 0;
            ta.exists = new Object();
            for each (refs in rsp[st]) {
                for each (photo in refs.photo) {
                    ta.exists[ photo['@id'] ] = 1;
                    numExisting++;
                }
            }
            var msg = "<a target='_blank' href='http://www.flickr.com/groups/"+this.groupID()+"/pool/"+this.myNSID()+"/'><b>" + numExisting + "</b> photo" +
            (numExisting == 1 ? '' : 's') + "</a> found already in " + type;
            if (numExisting == 500) {
                msg += ". <i style='font-size:0.7em; color:brown'>This is the maximum number of matches that Flickr will return. Some of the images suggested below (as being absent from the "+type+") may in fact already be present.</i>";
            }
            qDiv.innerHTML = msg;
        }
        // We need information from both the tag query and the pre-existing members to continue:
        if (!ta.exists || !ta.results) return;

        var toShow = new Array();
        var available = 0;
        for (var r = 0; r < ta.results.length; r++) {
            var rdat = ta.results[r];
            if (rdat.done) continue; // do not process result set if already processed
            var kept = rdat.photos;
            // Find results that are not already in pool / set
            var ok = 0;
            for (var k = 0; k < kept.length; k++) {
                if (!ta.exists[ kept[k].id ]) {
                    // This photo is not in the pool
                    toShow.push( kept[k] );
                    ok++;
                }
            }
            var msg = rdat.args.div.innerHTML;
            if (ok == 0) {
                msg += ", all of which are already in the " + type;
            } else {
                msg += ", <span style='font-weight:bold; color:green'>"+ok+ "</span> of which " + 
                    (ok == 1 ? 'is' : 'are')+ " not yet in the " +type;
                if (ok > available) available = ok;
            }
            rdat.args.div.innerHTML = msg;
            rdat.done = 1;
        }
        GM_setValue(this.groupID() + this.fids.grpAvl, available);
        if (toShow.length == 0) return;

        var you  = this.whoami();
        var form = ta.form;
        if (!form) {
            var clr  = document.createElement('button'); clr.innerHTML = "Clear All";
            var chk  = document.createElement('button'); chk.innerHTML = "Check All";
            var form = ta.form = document.createElement('form');
            form.innerHTML = "<input style='font-weight:bold; background-color: #6f6' type='submit' value='Submit to "+type+"' /> | ";
            form.appendChild(clr);
            form.appendChild(chk);
            targ.appendChild(form);
            // Arm the various buttons
            form.addEventListener('submit', function (e) {
                    // console.log("E: " +e);
                e.preventDefault();
                return CatFlickrSuite.tagAssocSubmit(form);}, false);
            clr.addEventListener('click', function (e) {
                e.preventDefault();
                return CatFlickrSuite.setCheckboxes('orgIds', false);}, false);
            chk.addEventListener('click', function (e) {
                e.preventDefault();
                return CatFlickrSuite.setCheckboxes('orgIds', true);}, false);
        }
        var lim   = ta.limit;
        var defc  = (type == 'Set') ? " checked='checked'" : '';
        var togF  = this.toggleChildVisibility;
 
        for (var ts = 0; ts < toShow.length; ts++) {
            if (lim && ta.shownum >= lim) {
                // Limit reached
                ta.complete = 1;
                var comp = document.createElement('div');
                comp.innerHTML = "Requested limit of "+lim+" reached.";
                comp.style.fontSize  = '0.7em';
                comp.style.fontStyle = 'italic';
                comp.style.color     = 'brown';
                targ.appendChild(comp);
                break;
            }
            var photo = toShow[ts];
            var pid   = photo.id;
            if (ta.shown[ pid ]) continue;
            var div   = document.createElement('div');
            div.className = 'photodiv';
            div.innerHTML = "<input type='checkbox' name='orgIds' value='"+pid+"' "+defc+"><a target='_blank' style='color: blue ! important' href='http://www.flickr.com/photos/"+you+"/"+pid+"/'>"+ photo.title+"</a><div style='display:none; position:relative;'><img src='"+photo.src+"' style='position:absolute; top: 5px; left:2em;' /></div>";
            div.addEventListener('mouseout',  togF, false);
            div.addEventListener('mouseover', togF, false);
            form.appendChild( div );
            ta.shown[ pid ] = 1;
            ta.shownum++;
        }
      // http://www.flickr.com/photos/organize/?ids=189644777,189670488
    },
    toggleChildVisibility: function( e ) {
        var obj  = e.target;
        while (obj && obj.className != 'photodiv') {
           obj = obj.parentNode;
        }
        if (!obj) return;
        var kids = obj.childNodes;
        if (!kids) return;
        if (e.type == 'mouseout') {
            kids[2].style.display = 'none';
            kids[1].style.backgroundColor = null;
       } else {
            kids[2].style.display = 'block';
            kids[1].style.backgroundColor = '#ff9';
         }
    },
    setCheckboxes: function(name, bool) {
        var ids = document.getElementsByName(name);
        if (!ids) return;
        for (var i=0; i<ids.length; i++) { ids[i].checked = bool }
    },
    tagAssocSubmit: function (frm) {
        var ids = document.getElementsByName('orgIds');
        if (!ids) return;
        var apiArgs = {  };
        var type    = this.env.pageType;
        if (type == 'Group') {
            apiArgs.method   = 'flickr.groups.pools.add';
            apiArgs.group_id = this.groupID();
        } else if (type == 'Set' && this.env.set) {
            apiArgs.method   = 'flickr.photosets.addPhoto';
            apiArgs.photoset_id = this.env.set;
        }
        if (!apiArgs.method) { alert("Failed to find ID for "+type); return; }
        var tot = 0;
        // We are going to be stripping elements out - this mucks up the ids[] array, so we will first map the checkboxes into a static array
        var elements = new Array();
        for (var i=0; i < ids.length; i++) {
            elements.push(ids[i]);
        }
        // Now we can cycle over elements:
        for (var i=0; i < elements.length; i++) {
            var el = elements[i];
            if (!el || !el.checked) continue;
            var par  = el.parentNode;
            var span = document.createElement('span');
            par.insertBefore(span,el);
            span.style.color = 'orange';
            span.style.fontSize = 'smaller';
            span.innerHTML = "Loading...";
            apiArgs.photo_id = el.value;
            par.removeChild( el );
            this.getAuthToken();
            this.flickrApi( apiArgs, 'tasubCB', {ticktype: 'groupLoad', el: span, failok: 1} );
            tot++;
        }
        if (tot < 1) { alert("Please select at least one photo"); return }
    },
    tasubCB: function (rsp, args, cfsArgs) {
        // This function just reports on the success or failure of an
        // attempt to add photos to a group or set
        var el  = cfsArgs.el;
        if (!el) return;
        var txt = rsp.toString();
        if (!txt || /^\s*$/.test(txt)) {
            // A response of nothing means success:
            el.style.color = 'green';
            el.innerHTML = 'Success! ';
        } else {
            el.style.color = 'red';
            var err = cfsArgs.error;
            if (!err) { err = "|Unknown Error|"; console.log(txt) }
            el.innerHTML = err + ' ';
       }
    },
    cleanComments: function () {
        // Only relevant for "Comments You've Made":
        if (this.env.pageView != 'YourComments' ) return;
        var tabs = document.getElementsByTagName('table');
        var re  = new RegExp("Here's the latest \\d+\\)", "g");
        for (var t=0; t < tabs.length; t++) {
            var tab = tabs[t];
            if (tab.className != 'NewComments') continue;
            var par = tab.parentNode;
            var partabs = par.getElementsByTagName('table');
            var prior = partabs[0];
            var html = prior.innerHTML;
            var hit  = html.match(re);
            if (!hit || hit.length < 1) continue;
            tab.style.display = 'none';

            var span = document.createElement('span');
            span.style.color = 'blue';
            span.style.backgroundColor = 'yellow';
            span.innerHTML = "click to view comments";
            par.insertBefore(span, tab);
            tab.style.display = 'none';
            span.addEventListener('click', function (e) {
                this.innerHTML = 'clicked';
                var targ = this.nextSibling.style;
                if (targ.display == 'none') {
                    this.innerHTML = 'click to hide comments';
                    targ.display   = 'block';
                } else {
                    this.innerHTML = 'click to view comments';
                    targ.display   = 'none';
                }
            }, false);
        }
    },
    annotateGroupList: function () {
        // alert(this.env.pageView);
        if (this.env.pageView != 'YourGroups' ) return;
        this.groupsWithTagMatches();
    },
    sortGroups: function() {
        var avail = this.groupsWithTagMatches();
        if (!avail.length) return;
        if (1) {
            sorted = avail.sort( function (a,b) { return b[1] - a[1]; } );
        } else {
            sorted = avail.sort( function (a,b) { return a[1] - b[1]; } );
        }
        
        for (var l = 0; l < sorted.length; l++) {
            var li = sorted[l][0];
            var ul = li.parentNode;
            if (!ul) continue;
            // console.log("#"+l+" = "+li+" Group: "+li.cfsGroup+" Num: "+sorted[l][1]);
            ul.removeChild(li);
            ul.appendChild(li);
        }
    },
    groupsWithTagMatches: function () {
        if (this.groupsAvailable) return this.groupsAvailable;
        var lis    = document.getElementsByTagName('li');
        var idTest = /group_(\S+)/;
        var tot    = 0;
        var par;
        var found = new Array();
        for (var l = 0; l < lis.length; l++) {
            var li = lis[l];
            var id = li.id;
            if (!id) continue;
            var hits = id.match(idTest);
            if (!hits) continue;
            var available = GM_getValue(hits[1] + this.fids.grpAvl);
            if (available == null) {
                available = -1;
            } else {
                var ht = document.createElement('i');
                ht.style.color = available == 0 ? 'gray' : 'orange';
                ht.innerHTML = ' '+ available;
                li.appendChild(ht);
                tot += available;
                par = li;
            }
            found.push([li, available]);
            li.cfsGroup = found.length;
        }
        if (par) {
            var msg = "<i style='color:orange'>"+tot+
            "</i> = photos matching your tag criteria available ";
            var mli = document.createElement('li');
            mli.innerHTML = msg;
            var srt = document.createElement('button'); srt.innerHTML = "Sort";
            mli.appendChild(srt);
            par  = par.parentNode;
            par.insertBefore(mli, par.firstChild);
            srt.addEventListener('click', function (e) {
                    e.preventDefault();
                    return CatFlickrSuite.sortGroups();}, false);
        }
        return this.groupsAvailable = found;
    },
    colorStats: function () {
        if (this.env.pageView != 'Stats' ) return;
        var nodes = document.getElementsByTagName('a');
        var isSearch = new RegExp('Searched for:');
        var isGroup  = new RegExp('\/groups\/');
        var isSet    = new RegExp('\/sets\/');
	var isTag    = new RegExp('\/([^\/]+)\/tags\/[^\/]+')
        for (var n=0; n<nodes.length; n++) {
		var node = nodes[n];
            if (!node || !node.href) continue;
		var styles = 0;
            var iH = node.innerHTML;
             if (isSearch.test(iH)) {
		 styles = { color: 'green', fontWeight: 'bold', border:'solid green 1px' };
	     } else if (isTag.test(iH)) {
		 mat  = iH.match(isTag);
		 styles = { fontWeight : 'bold', color: mat[1] == 'photos' ? 'purple' : 'blue' };
	     } else if (isGroup.test(iH)) {
		 styles = { fontWeight : 'bold', color: 'orange' };
	     } else if (isSet.test(iH)) {
		 styles = { fontWeight : 'bold', color: '#f0f' };
	     }
		if (!styles) continue;
		for (var s in styles) {
		    node.style[ s ] = styles[s];
		}
        }
    },
    findMultiPost: function () {
        // Only relevant for group photo pools:
        if (this.env.pageView != 'Pool' ) return;
        // Find users that have posted more than one photo on the current page
        var struct = new Object();
        // Scan all 'user photo links' - as found by registerUserPhoto()
        var arr  = this.liveUserPhotoList();
        var pool = this.objects.poolImages = new Object();
        for (var i=0; i < arr.length; i++) {
            var el  = arr[i];
            var par = el.parentNode;
            // Only take note of links inside a PoolList classed object
            if (par.className != 'PoolList') continue;
            var pid = this.imageIdFromNode(par);
            if (pid) pool[pid] = par;
            var purl   = this.privateHash(el, 'purl');
            if (!struct[purl]) {
                // Initiate data stucture for this user
                struct[purl] = {
                    pars: new Array(),
                    name: this.privateHash(el, 'dispid'),
                };
            }
            struct[purl].pars.push( par );
        }
        var pcount = 0; // Total thumbnails on the page
        var ucount = 0; // Total unique users on the page
        var multi = new Array();
        // Now look at each unique user
        for (var purl in struct) {
            ucount++;
            var pars  = struct[purl].pars;
            var count = pars.length;
            pcount   += count;
            if (count > 1) {
                // This user has more than one photo on the page
                // Get the user's automatically generated color...
                var col  = "rgb("+this.color4string( purl )+")";
                // ... and set the background of each thumbnail to that color
                if (this.user.colorMult == 1) {
                    for (var p=0; p < pars.length; p++) {
                        pars[p].style.backgroundColor = col;
                    }
                }
                var name = struct[purl].name;
                // Now make a summary token to put at the top of the
                // page - we will have a link that will be activated
                // as a pop up:
                var link = document.createElement('a');
                link.href = "/photos/" + purl +"/";
                link.innerHTML = name;
                this.registerUserPhoto(link);
                // ... which will be held in a span that will have the
                // user's auto-color:
                var span = document.createElement('span');
                span.innerHTML = "<b>"+count+":</b>&nbsp;";
                span.appendChild(link);
                span.style.backgroundColor = col;
                // Store in array for later sorting:
                multi.push( [count, span ] );
            }
        }
        // If all images are singletons, return with no action:
        if (multi.length < 1) return;
        // Also exit if the user does not want a summary
        if (this.user.sumMult != 1) return;
        // Sort the users high-to-low:
        multi = multi.sort( function (a,b) { return b[0] - a[0]; } );
        // Slap in the little spans under the Main div:
        var target  = document.getElementById(this.fids.main);
        for (var m=0; m < multi.length; m++) {
            target.parentNode.insertBefore(multi[m][1],target);
        }
        // Generate a summary of how many users are unique:
        var divId = 'CatFlickrSuiteMultiDiv';
        var div = document.getElementById(divId);
        if (!div) {
            div = document.createElement('div');
            div.id = divId;
        }
        var uperc = Math.floor(100 * ucount / pcount);
        div.innerHTML = "<b>"+ucount + "</b> users = <b>"+uperc+"%</b> of maximum";
        target.parentNode.insertBefore(div,target);
    },
    getAllComments: function () {
        // Only relevant for group photo pools:
        if (this.env.pageView != 'Pool' ) return;
        // Do nothing if the user has requested so:
        if (this.user.getCom != 1) return;
        var pool = this.objects.poolImages;
        this.objects.comments = new Object();
        this.objects.shownComments = new Object();
        for (var pid in pool) {
            var ticket = this.requestImageComments( pid );
        }
    },
    imageIdFromNode: function(el) {
        var focus = el;
        while (!focus.href || !/\/photos\/[^\/]+\/\d+/.test(focus.href)) {
            if (focus.hasChildNodes()) {
                focus = focus.firstChild;
            } else if (focus.nextSibling) {
                focus = focus.nextSibling;
            } else {
                // Failed to find image link
                focus = null; break;
            }
        }
        var id;
        if (focus && focus.href) {
            var hits = focus.href.match( this.re.photoID );
            if (hits) id = hits[2];
        }
        return id;
    },
    requestImageComments: function( id ) {
        if (!id) return;
        // If we have already recovered comments for this id, do not do so again:
        if (!this.doneTask.getComments) this.doneTask.getComments = new Object();
        if (this.doneTask.getComments[ id ]++) return true;
        var tkey = 'getComments';
        // Set up ticket status queue if needed
        if (!this.ticketStatus[tkey]) this.ticketStatus[tkey] = new Object();
        return this.flickrApi
        ( { method: 'flickr.photos.comments.getList', photo_id: id },
          'ricCB', {ticktype: tkey} );
    },
    ricCB: function(rsp) {
        var hash = this.objects.comments;
        for each (comments in rsp.comments) {
            // for (var cs = 0; cs < rsp.comments.length; cs++) {
            // var comments = rsp.comments[cs];
            var pid  = comments['@photo_id'];
            for each (com in comments.comment) {
                var uname  = com['@authorname'];
                var nsid   = com['@author'];
                this.setTranslation( { uname: uname, nsid: nsid } );
                // var create = new Date( com.@datecreate );
                var ctxt  = com + '';
                // Strip out HTML tags:
                ctxt = ctxt.replace(/(\<|\&lt\;).+?(\>|\&gt\;)/g,'');
                // Collapse all whitespace runs to single spaces:
                ctxt = ctxt.replace(/[\s\n\r\t]+/g, ' ');
                if (/^\s*$/.test(ctxt)) ctxt = "HTML only" ;
                // Store data under both authorname and photo ID (hash
                // will collide only if someone is using a pure
                // integer as a name AND a photo has same integer).
                var info = { txt: ctxt, uname: uname, photo: pid };
                if (!hash[uname]) hash[uname] = new Array();
                if (!hash[pid])   hash[pid]   = new Array();
                hash[uname].push(info);
                hash[pid].push(info);
            }
        }
        this.msg();
    },
    checkClickEvent: function(evt) {
        if (!evt) {
            console.log("Click event fails to pass the event object!");
            return false;
        }
        if (evt.which != 1) return false; // Only consider for left button
        var el = evt.target;
        while (1) {
            if (el.getAttribute && el.getAttribute('userPhoto')) {
                // This is a link to a user photo stream
                return this.userPhotoClick(el, evt);
            }
            if (!el.parentNode) break;
            el = el.parentNode;
        }
        // console.log("Click on "+el+" deemed not a user photo link");
        return false;
    },
    registerUserPhoto: function(el) {
        // Take a link with target '/photos/USERID/' and add pop-up
        // functionality to it. This method also stores the link in an
        // internal structure
        var purl = this.isUserPhoto(el);
        if (!purl) return 0;
        var dispid  = el.text;
        if (this.privateHash(el, 'parsed')) return dispid;
        // Ok, this looks like the sort of link we want to modify
        // (and have not already done so)
        this.privateHash(el, 'purl', purl);
        this.privateHash(el, 'dispid', dispid);
        this.privateHash(el, 'parsed', true);
        this.setTranslation( { dispid: dispid, purl: purl } );
        el.setAttribute('userPhoto', dispid);
        return dispid;
    },
    insertSettings: function() {
        // Add a settings menu
        var targ = document.getElementById(this.fids.navOrg);
        if (!targ) {
            console.log("Failed to find 'Organize' menu item for settings");
            return;
        }
        var liL  = document.createElement('li');
        var setL = document.createElement('a');
        setL.href = "javascript:void(0)";
        setL.innerHTML = "Flickr Suite Settings";
        setL.addEventListener('click', function (e) {
            return CatFlickrSuite.settingsClick(this, e);}, false);
        liL.appendChild(setL);
        targ.appendChild(liL);
    },
    settingsClick: function (el, evt) {
        var items = new Array();

       items.push("<span class='CancelButt'>[x]</span>&nbsp;"+
                   "<span style='font-weight:bold;color:blue'>"+
                   "Flickr Suite GreaseMonkey Settings</span>");
        for (var type in this.userSet) {
            // Cycle through each data type
            var info = this.userSet[type];
            if (type == 'checkbox') items.push( "<b>Active Suite Functions:</b>" );
            for (var tag in info) {
                var val  = this.user[tag];
                var desc = info[tag][0];
                var inpt = { tag: 'input', type: type, id: 'CFS'+tag };
                if (type == 'checkbox') {
                    inpt.text = desc;
                    if (val == 1) inpt.checked = 'checked';
                } else if (type == 'text') {
                    inpt.text  = desc;
                    inpt.value = val;
                    inpt.size  = 5;
                } else if (type == 'textarea') {
                    delete inpt.type;
                    inpt.tag  = type;
                    inpt.cols = 30;
                    inpt.rows = 10;
                    inpt.pre  = "<b>"+desc+":</b><br />";
                    inpt.text = val;
                }
                items.push(inpt);
            }
        }
        items.push( "<i>Close menu, then <b>reload page</b> to see changes</i>" );
        items.push({ pre: "Check ", post: " for updates to this suite", text: 'userscripts.org', target:'userscripts', href: 'http://userscripts.org/scripts/show/5016', });
        var html;
        try {
            // Some weirdness during development, so be safe in a try/catch
            html = this.makeMenu( items );
        } catch(e) {
            this.err("Failed to make settings menu for ", e);
            return false;
        }
        // Pop up the window
        var div = this.popUp(el, html, evt);
        this.privateHash(div, 'onclose', function() {
                CatFlickrSuite.updateSettings();
            } );
        return false;
    },
    updateSettings: function (el) {
        // Note that we have succesfully gotten to the callback
        this.privateHash(el, 'onclose', false );
        // Scan all user configurable settings, put values in GreaseMonkey persistant store
        var uarr = this.userSetArr;
        for (var u=0; u < uarr.length; u++) {
            var type = uarr[u][0];
            var tag  = uarr[u][1];
            var inpt = document.getElementById('CFS' + tag);
            if (!inpt) continue;
            var val;
            if (type == 'checkbox') {
                // Data in checkboxes
                val = (inpt.checked) ? 1 : 0;
            } else {
                val = inpt.value;
            }
            GM_setValue(tag , val);
        }
        // Reparse all user settings
        this.setSettings();
    },
    updateUser: function (el) {
        // Note that we have succesfully gotten to the callback
        this.privateHash(el, 'onclose', false );
        var purl    = this.privateHash(el, 'purl');
        var setCol = document.getElementById(this.fids.csfCols);
        if (setCol) {
            // There is a list of colors attributed to this user
            var kids = setCol.childNodes;
            var setCols = new Array();
            for (var k=0; k < kids.length; k++) {
                var col = kids[k].getAttribute('colName');
                if (col) setCols.push(col);
            }
            GM_setValue("UserColor"+purl, setCols.join(" "));
        }
        // Re-color any user links
        this.colorUserPhotos( purl );
    },
    color4string: function( txt ) {
        // This method takes a string (for example a user ID) and
        // converts it to a reproducible RGB color. There are probably
        // more elegant ways to do this (I'd like to know of them) -
        // the basic goal is to get good spread of the color spectrum,
        // without being too dark or too light, and avoiding gray
        // scales.
        // Make a string that's just the concatenation of all the decimal ascii codes:
        var hash = "";
        for (var j = 0; j < txt.length; j++) {
            var code = txt.charCodeAt(j);
            hash    += code.toString();
        }
        var col     = new Array();
        var colMv   = 0;
        // Break the long integer into three equal sized pieces:
        var block   = Math.floor(hash.length/3);
        var colSpan = this.colMax - this.colMin + 1;
        var colBuf  = this.colBuf;
        if (colBuf > colSpan / 4) colBuf = Math.floor(colSpan / 4);
        for (var b = 0; b < 3; b++) {
            var si   = b * block;
            var subh = hash.substring( si, si + block - 1 );
            // Turn the sub-hash into colMin-colMax (modulus colSpan)
            var val = this.colMin + ((parseInt(subh) * 7353) % colSpan);
            for (var c = 0; c < b; c++) {
                // make sure this color value is far enough from the prior ones
                var pval = col[c];
                if (val > pval - this.colBuf && val < pval + this.colBuf) {
                    // This color index is too close to another
                    if (colMv == 0) colMv = (val < pval) ? -1 : 1;
                    if (colMv > 0) {
                        val = pval + this.colBuf;
                        if (val > this.colMax) val -= colSpan;
                    } else {
                        val = pval - this.colBuf;
                        if (val < this.colMin) val += colSpan; 
                    }
                }
            }
            col.push(val);
        }
        // Now finally rotate the three colors
        var rot = parseInt(hash) %3;
        for (var r = 0; r < rot; r++) {
            col.push( col.shift() );
        }
        return col;
    },
    popUp: function (el, html, evt) {
        // Popup a mini menu on a mouse click
        var div = document.getElementById(this.fids.csfPop);
        if (!div) {
            // Create the object once, then keep it
            div = document.createElement('div');
            div.id = this.fids.csfPop;
            div.className = 'ToolTip';
            div.style.zIndex = '9999';
            document.body.appendChild(div);
            // Using an event listener to monitor activity on our popup
            div.addEventListener('click', function (e) {
                    return CatFlickrSuite.popClick(e);
                }, false);
        } else {
            // We are recycling the same object as the popup (so only
            // one popup allowed at a time). Registration of user
            // changes in the popup occurs when the user closes the
            // window - make sure that if the window was not
            // explicitly closed (that is, it is open in another
            // location) that we still save the user settings:
            var cb = this.privateHash(div, 'onclose');
            if (cb) cb( div );
        }
        // Position div under click (-15 offset attempts to get close box under mouse)
        div.style.top     = (evt.pageY - 15) + 'px';
        div.style.left    = (evt.pageX - 15) + 'px';
        // Update content:
        div.innerHTML     = html;
        // Make sure it is visible:
        div.style.display = 'block';
        // clear any private variables associated with the popup
        this.clearPrivate(div);
        return div;
    },
    popClick: function (e) {
        // Respond to a click event in our popup
        if (!e || !e.originalTarget) return;
        var targ  = e.originalTarget;
        var par   = targ.parentNode;
        var cname = targ.className;
        while (!cname && par) {
            // Back out of DOM tree until we find a classed target
            targ  = par;
            par   = targ.parentNode;
            cname = targ.className;
        }
        if (!par || !cname) return;
        if (cname == 'CancelButt') {
            // A click within a close button [x] - hide the popup
            this.popClose(par);
        } else if (cname == 'CloseComment') {
            this.toggleComments(par);
        } else if (cname == 'SetColor') {
            // A click within a 'set user color' selection
            var addTo = document.getElementById
            (par.id == this.fids.csfCols ? this.fids.csfAvl : this.fids.csfCols);
            if (!addTo) return;
            addTo.appendChild(targ);
        } else if (cname == 'ShowComments') {
            this.toggleComments(par);
        }
    },
    toggleComments: function (el) {
        var dispid = this.registerUserPhoto(el);
        var uname  = this.getTranslation(dispid, 'uname');
        if (!uname) return;
        var coms   = this.objects.comments[uname];
        if (!coms) return;
        var list  = this.objects.shownComments[uname];
        if (list) {
            // Already showing comments - hide them
            for (var l=0; l < list.length; l++) {
                var el = list[l];
                el.parentNode.removeChild(el);
            }
            this.objects.shownComments[uname] = null;
            return;
        }
        list = this.objects.shownComments[uname] = new Array();
        var struct = new Object();
        for (var i=0; i < coms.length; i++) {
            var info = coms[i];
            var pid  = info.photo;
            if (!struct[pid]) struct[pid] = new Array();
            struct[pid].push( info.txt );
        }
        var pool = this.objects.poolImages;
        var purl  = this.privateHash(el, 'purl');
        var col  = "rgb("+this.color4string( purl )+")";
        var elips = "<span style='color:red;font-weight:bold'>&hellip;</span>";
        for (var pid in struct) {
            var targ = pool[pid];
            if (!targ) {
                this.err("Could not find pool image ID="+pid);
                continue;
            }
            var html = "<span style='color:red;background-color:yellow' class='CloseComment'>["+dispid+"]</span>";
            var maxlen = this.user.comWidth;
            for (var c=0; c < struct[pid].length; c++) {
                // If there are multiple comments, separate them by
                // slightly differnt background colors
                var com = struct[pid][c];
                if (maxlen > 0 && com.length > maxlen) com = com.substr(0,maxlen) + elips;
                html += "<span style='background-color:"+( c%2 ? '#cfc' : '#9f9')+"'>"+com+"</span>";
            }
            var el = document.createElement('div');
            el.innerHTML = html;
            targ.appendChild(el);
            el.style.fontSize  = this.user.comSize;
            el.style.border    = col+" solid 1px";
            el.style.textAlign = 'left';
            el.style.zIndex   = 100;
            el.style.position = 'relative';
            el.style.left     = '-4px';
            el.style.width    = '118px';
            el.className      = "CommentBox";
            this.privateHash(el, 'dispid', dispid);
            list.push(el);
            el.addEventListener('click', function (e) {
                    return CatFlickrSuite.popClick(e);
                }, false);
            //targ.style.height = "100%";
        }
    },
    popClose: function (el) {
        // Does the window have a callback associated with it?
        var cb = this.privateHash(el, 'onclose');
        if (cb) cb( el );
        // Set display to none to hide menu
        el.style.display = 'none';
    },
    makeMenu: function( arr ) {
        // Build a little menu given an array of 'lines'
        if (!arr || arr.length < 1) return "";
        var lines = new Array();
        try {
            for (var i=0; i < arr.length; i++) {
                var info = arr[i];
                if (typeof(info) == 'string') {
                    // If this entry is a simple string, use it as is
                    lines.push(info);
                    continue;
                }
                // Otherwise, assume it is an object that will be turned
                // into a tag, with keys being attribute names. The
                // 'text' attribute is taken as the link text:
                var tag = info.tag;
                if (!tag || tag == '') tag = 'a';
                var txt = ">"+info.text+"</"+tag+">";
                // Free text to put after the link
                if (info.post) txt += info.post;
                // Remove special attrs so they do not become an part of the tag
                delete info.tag; delete info.post; delete info.text; 
                var attrs = new Array();
                for (var attr in info) {
                    var val = info[attr];
                    if (!val) val = "";
                    // Escape single quotes
                    if (typeof(val) == 'string') val = val.replace("'", "\\'");
                    attrs.push(attr+"='"+val+"'");
                }
                txt = "<"+tag+" "+attrs.join(' ')+txt;
                if (info.pre) txt = info.pre + txt;
                // Join all attributes into an anchor tag
                lines.push(txt);
            }
        } catch (e) {
            this.err("Failed to make menu for "+arr.length+" items", e);
            return "";
        }
        // Join all lines into a single block of text
        return lines.join("<br />\n");
    },
    hashToLog: function (obj, title) {
        var msg = "Hash report for "+obj+":\n";
        if (title) msg += title + "\n";
        if (obj) {
            var num = 0;
            for (var key in obj) {
                msg += key + ": "+obj[key]+"\n";
                num++;
            }
            msg += num + " key"+(num == 1 ? '' : 's')+"\n";
        } else {
            msg += "/null/\n";
        }
        console.log(msg);
    },
    valuesForNamedInput: function(form, name) {
        /* Huh. It used to work that if I had an <input> named 'foo' in a form
           represented by object bar, I could get it with bar.foo, but
           not anymore... */
        var rv = new Array();
        if (!form || !form.elements || !name) return null;
        name = name.toLowerCase();
        for (var e = 0; e < form.elements.length; e++) {
            var inp = form.elements[e];
            if (inp.name.toLowerCase() != name) continue;
            rv.push(inp.value);
        }
        return rv;
    },
    privateHash: function(el, tag, val) {
        // Private hash holding tag / value pairs on HTML elements
        // The function is both a setter and a getter
        var key = this.setElementId(el);
        if (!key || !tag)  return null;
        // Initialize the hash if this is the first access on the element:
        if (!this.privateData[key]) {
            // this.gmMsg += "Establish new private data for " + key+"\n";
            this.privateData[key] = new Object();
        }
        tag = tag.toLowerCase();
        if (val != null) {
            // Request to set the value
            this.privateData[key][tag] = val;
            // this.gmMsg += "Set "+tag+"="+val+" for " + key+"\n";
        }
        // Return the current value
        return this.privateData[key][tag];
    },
    logPrivateData: function( hash ) {
        if (!hash) hash = this.privateData;
        var txt = "Hash dump for " + hash + "\n";
        for (var key in hash) {
            txt += "["+key+"]\n";
            var kh = hash[key];
            if (typeof(kh) == 'object') {
                for (var tag in kh) {
                    txt += "  ["+tag+"] = '"+kh[tag]+"'\n";
                }
            } else {
                txt += "  !! Hash expected, found '"+kh+"'\n";
            }
        }
        console.log(txt);
    },
    setTranslation: function (data, debugMsg) {
        // Are any other data associated with these?
        for (var type in data) {
            var existing = this.translate[ data[type] ];
            if (existing) {
                // One of these values is already recorded
                var novel = this.mergeHash( existing, data );
                if (novel == 0) {
                    // No new additions to the tranlsation hash:
                    return;
                }
                data = existing;
                break;
            }
        }
        // If uname is not set it is the same as the display ID, if it is not elipsed
        if (!data.uname && data.dispid && 
            !this.re.elipsed.test(data.dispid)) data.uname = data.dispid;
        // We can generally get the username from the displayed ID
        if (!data.dispid && data.uname) {
            // I *THINK* 20 is the upper limit... ?
            if (data.uname < 20) {
                data.dispid = uname;
            } else {
                // Hmm...
            }
        }
        // Cycle through the hash again, update all keys in translation to point to same hash:
        for (var type in data) {
            if (debugMsg) this.gmMsg += type + " = " + data[type] + "\n";
            this.translate[data[type]] = data;
        }
    },
    getTranslation: function( term, type ) {
        var thash = this.translate;
        var data  = (term in thash) ? thash[term] : null;
        if (!data) return null; // Nothing at all found
        if (!type) return data; // The user wants the full hash
        // Specific term type requested for return
        if (type in data) return data[type]; // That type is present, return it
        // We found data, but no match for this type
        if ('dispid' in data && !('uname' in data) &&  this.re.elipsed.test(term)) {
            // The query term is an elipsed display id, which does not
            // yet have a true uname associated with it - see if we
            // can find a match to a username
            var elipre  = this.re.elipsed;
            // Thanks to John Carney for pointing out that I need to
            // escape RE tokens in the username when building this
            // regexp. I miss \Q..\E in perl!
            var matcher = new RegExp(term.replace(elipre,'').
                                     replace(/([(){}.^$*?+\[\]\\])/g, '\\$1')+'.+$');
            for (var tag in thash) {
                // Ignore if this tag does not match, or is itself
                // elipsed, or the matched hash does not have a
                // username defined.
                if (!matcher.test(tag) || elipre.test(tag) || 
                    !('uname' in thash[tag])) continue;
                // We have a match - combine the two hashes
                this.mergeHash(data, thash[tag]);
                this.setTranslation(data);
                if (type in data) return data[type];
            }
        }
        return null;
    },
    mergeHash: function(hashA, hashB) {
        // Adds the key/val pairs of hashB to hashA
        var newVals = 0;
        for (var tag in hashB) {
            if (!(tag in hashA)) { hashA[tag] = hashB[tag]; newVals++; }
        }
        return newVals;
    },
    setElementId: function(el) {
        if (!el) return null;
        if (!el.id) {
            // this.gmMsg += "New ID added to " + el + "\n";
            el.id = "CFS" + "_" + this.ms + '_' + ++this.counter;
        }
        return el.id;
    },
    clearPrivate: function(el) {
        // Clear out private variables associated with an element
        if (!el) return;
        var key = this.setElementId(el);
        var rv  = this.privateData[key];
        // Totally wipe the settings:
        // this.gmMsg += "Clearing private data for " +key+"\n";
        this.privateData[key] = new Object();
        return rv; // Return the old settings
    },
    buildGetString: function (args, noToken) {
        delete args[ "api_sig" ];
        if (unsafeWindow.global_auth_hash) {
            // I believe this is the old authentication?
            args[ "auth_hash" ] = unsafeWindow.global_auth_hash;
        } else {
            delete args[ "auth_hash" ];
        }
        // Always add the api_key:
        args[ "api_key" ] = this.apikey;
        // Add the auth token if it is available
        if (this.authTok) args[ "auth_token" ] = this.authTok;
        // if (!noToken && ! args['frob']) args[ "auth_token" ] = this.getAuthToken();

        // Sort all the parameter names:
        var argList  = new Array();
        for (var arg in args) { argList.push( arg ); }
        argList = argList.sort();
        // Build the basic parameter list
        var get = "";
        for (var al = 0; al < argList.length; al++) {
            var arg = argList[al];
            var val = args[arg];
            if (val == null) continue;
            if (get) get += "&";
            get += arg + "=" + val;
            sig += arg + val;
        }
        var signIt = args['auth_token'] || args['frob'] ? 1 : 0;
        if (signIt) {
            // We also need to sign the GET parameters
            var sig = this.getSecKey();
            for (var al = 0; al < argList.length; al++) {
                var arg = argList[al];
                var val = args[arg];
                if (val == null) continue;
                sig += arg + val;
            }
            // MD5 the signature string and append as a new parameter:
            var md5 = hex_md5(sig);
            get += "&api_sig="+md5;
        }
        return get;
    },
    getSecKey : function () {
        return this.seckey;
    },
    getAuthToken : function () {
        if (this.authTok) return this.authTok;
        // Try to get token from local store:
        this.authTok = GM_getValue("FlickrAuthTok");
        if (this.authTok) {
            console.log("Authorization token recovered from local storage - " + this.authTok);
            return this.authTok;
        }
        // Need to generate new token:
        return this.frobToAuth();
    },
    frobToAuth: function () {
        var frob = this.getFrob();
        this.flickrApi( { method: "flickr.auth.getToken", frob: frob }, 'parseAuth' );
        return this.authTok;
    },
    parseAuth: function (rsp) {
        var toks = new Array();
        for each (auth in rsp.auth) {
           for each (tok in auth.token) {
               var token = tok + "";
               if (token) toks.push(token);
           }
        }
        if (toks.length == 1) {
            this.authTok = toks[0];
            GM_setValue("FlickrAuthTok", toks[0]);
            console.log("Authorization token returned by Flickr API");
        } else {
            this.err("Failed to recover auth_token");
        }
        return this.authTok;
    },
    getFrob: function () {
        if (this.frob) return this.frob;
        // Try to get frob from local store:
        this.frob = GM_getValue("FlickrFrob");
        if (this.frob) {
            console.log("Frob recovered from local storage");
            return this.frob;
        }
        // Need to go to authentication page
        var get = this.buildGetString( { perms: 'write' }, 'NO AUTH' );
        var url = "http://www.flickr.com/services/auth/?" + get;
        // Need to open a new page
        window.open(url, "_blank");
        var msg = "";
        if (this.frobTry) msg += "Hm. You have tried "+this.frobTry+
                              " time(s) but have not authenticated...\n";
        msg +=
        "Flicker Functional Suite has opened a new window.\n"+
        "It will request 'write' permission for your photo stream.\n"+
        "If you are comfortable with that, please grant permissions\n"+
        "and close this alert AFTER you grant them.\n"+
        "If you are not, you may ignore the request, but FFS will not function properly"
        alert(msg);
        this.frobTry++;
        return grabFrob();
    },
    grabFrob: function () {
        var loc = document.location.href;
        var mat = loc.match(this.re.frob);
        if (!mat) return;
        GM_setValue("FlickrFrob", this.frob = mat[1]);
        console.log("Frob recognized from Flickr authentication page");
    },
    flickrApi: function( args, cbname, cfsArgs ) {
        /* Generic method for an AJAX call to the Flickr API
         * cfsArgs
         *   failok: if true, then still execute the callback when error code encountered
         */
        var callback = this[cbname];
        var get      = this.buildGetString( args );
        if (!get) {
            // Failed to build get string. This usually means that authentication is under way
            // Store the arguments for recovery after
            return this.delayApi( args, cbname, cfsArgs );
        }

        var url = "http://api.flickr.com/services/rest/?" + get;

        var ticket = ++this.ticket;
        if (!cfsArgs) cfsArgs = new Object();
        cfsArgs.ticket = ticket;
        cfsArgs.url = url;
        if (cfsArgs.ticktype) {
            var tkey = cfsArgs.ticktype;
            if (!this.ticketStatus[tkey]) this.ticketStatus[tkey] = new Object();
            this.ticketStatus[tkey][ticket] = 'pending';
        }
        GM_xmlhttpRequest
        ({ method: "GET", url: url, headers: {
            "User-agent": "Mozilla/4.0 (compatible) Greasemonkey (Flickr Functional Suite)",
                "Accept": "application/atom+xml,application/xml,text/xml",
            }, onload: function(rsp) { CatFlickrSuite.parseXML(rsp,cbname,args,cfsArgs, url) } } );
        return ticket;
    },
    delayApi: function ( args, cbname, cfsArgs ) {
        if (!this.apiDelayStack) this.apiDelayStack = new Array;
        this.apiDelayStack.push( [ args, cbname, cfsArgs ] );
        return this.apiDelayStack.length;
    },
    resumeApi : function () {
        var stack = this.apiDelayStack;
        // Transfer full contents of delayed stack to local array
        var lStck = new Array();
        while (stack.length) {
            lStck.push( stack.shift() );
        }
        while (lStck.length) {
            var dat = lStck.shift();
            var ticket = this.flickrApi( dat[0], dat[1], dat[2] );
            console.log("Resuming API call: "+dat[1]);
        }
    },
    parseXML: function(response, cbname, args,cfsArgs, url) {
        // Takes an XML response from Flickr services and turns it into a E4X object
        // http://developer.mozilla.org/presentations/xtech2005/e4x/
        var txt  = response.responseText;
        txt      = txt.replace(/\s*\<\?[^\>]+\?\>\s*/g,'');
        var rsp  = new XML(txt);
        var stat = rsp['@stat'];
        var tick = cfsArgs.ticket;
        var tt   = cfsArgs.ticktype;
        var rv   = null;
        if (stat != 'ok') {
            var msg = "Failed to retrieve Flickr data via API:\n";
            cfsArgs.error = '|';
            var seenErrs = new Object();
            for each (err in rsp.err) {
                var ec = err['@code'];
                seenErrs[ec] = 1;
                msg += "  Error: " +ec+ " = "+err['@msg']+"\n";
                // cfsArgs.error += 'id='+args.photo_id+' ';
                cfsArgs.error += err['@msg'] + '|';
            }
            for (var arg in args) {
                msg += "  "+arg+'='+args[arg]+"\n";
            }
            msg += "URL: "+ url;
            if (seenErrs['99']) {
                // Insufficient priveleges. We need to start the authentication chain
                if (cfsArgs.pendingAuth) {
                    msg += "\nFAILED PRIOR AUTHENTICATION";
                } else {
                    this.delayApi( args, cbname, cfsArgs );
                    cfsArgs.error = '[Authenticating...]';
                    cfsArgs.pendingAuth = 1;
                    this.getAuthToken();
                    this.resumeApi();
                    return '[Authenticating...]';
                    msg = "Authentication required, attempting to authenticate";
                }
            }
            this.err(msg);
            if (tt) this.ticketStatus[tt][tick] = 'failed';
            if (!cfsArgs.failok) return rv;
        }
        try {
            rv = this[cbname](rsp, args, cfsArgs);
        } catch (e) {
            this.err("Failed to execute API callback "+cbname, e);
            if (tt) this.ticketStatus[tt][tick] = 'failed';
        }
        // Remove the ticket from the queue as being completed
        if (tt) delete this.ticketStatus[tt][tick];
        return rv;
    },
    apiStatus: function(tt) {
        // Report the status of an API queue
        if (!(tt in this.ticketStatus)) return "";
        var struct = new Object();
        for (var ticket in this.ticketStatus[tt]) {
            var stat = this.ticketStatus[tt][ticket];
            if (!struct[ stat ]) struct[ stat ] = 0;
            struct[ stat ]++;
        }
        var list = new Array();
        for (var stat in struct) {
            list.push( struct[ stat ] + ' ' + stat);
        }
        return list.join(",");
    },
};

// This is the call that starts the ball rolling - it launches the
// init() method when the page finishes loading:
window.addEventListener('load', function (e) {CatFlickrSuite.init();}, false);


/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;   /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = "";  /* base-64 pad character. "=" for strict RFC compliance   */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_md5(s)    { return rstr2hex(rstr_md5(str2rstr_utf8(s))); }
function b64_md5(s)    { return rstr2b64(rstr_md5(str2rstr_utf8(s))); }
function any_md5(s, e) { return rstr2any(rstr_md5(str2rstr_utf8(s)), e); }
function hex_hmac_md5(k, d)
  { return rstr2hex(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d))); }
function b64_hmac_md5(k, d)
  { return rstr2b64(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d))); }
function any_hmac_md5(k, d, e)
  { return rstr2any(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d)), e); }

/*
 * Perform a simple self-test to see if the VM is working
 */
function md5_vm_test()
{
  return hex_md5("abc").toLowerCase() == "900150983cd24fb0d6963f7d28e17f72";
}

/*
 * Calculate the MD5 of a raw string
 */
function rstr_md5(s)
{
  return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
}

/*
 * Calculate the HMAC-MD5, of a key and some data (raw strings)
 */
function rstr_hmac_md5(key, data)
{
  var bkey = rstr2binl(key);
  if(bkey.length > 16) bkey = binl_md5(bkey, key.length * 8);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
  return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
}

/*
 * Convert a raw string to a hex string
 */
function rstr2hex(input)
{
  try { hexcase } catch(e) { hexcase=0; }
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var output = "";
  var x;
  for(var i = 0; i < input.length; i++)
  {
    x = input.charCodeAt(i);
    output += hex_tab.charAt((x >>> 4) & 0x0F)
           +  hex_tab.charAt( x        & 0x0F);
  }
  return output;
}

/*
 * Convert a raw string to a base-64 string
 */
function rstr2b64(input)
{
  try { b64pad } catch(e) { b64pad=''; }
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var output = "";
  var len = input.length;
  for(var i = 0; i < len; i += 3)
  {
    var triplet = (input.charCodeAt(i) << 16)
                | (i + 1 < len ? input.charCodeAt(i+1) << 8 : 0)
                | (i + 2 < len ? input.charCodeAt(i+2)      : 0);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > input.length * 8) output += b64pad;
      else output += tab.charAt((triplet >>> 6*(3-j)) & 0x3F);
    }
  }
  return output;
}

/*
 * Convert a raw string to an arbitrary string encoding
 */
function rstr2any(input, encoding)
{
  var divisor = encoding.length;
  var i, j, q, x, quotient;

  /* Convert to an array of 16-bit big-endian values, forming the dividend */
  var dividend = Array(Math.ceil(input.length / 2));
  for(i = 0; i < dividend.length; i++)
  {
    dividend[i] = (input.charCodeAt(i * 2) << 8) | input.charCodeAt(i * 2 + 1);
  }

  /*
   * Repeatedly perform a long division. The binary array forms the dividend,
   * the length of the encoding is the divisor. Once computed, the quotient
   * forms the dividend for the next step. All remainders are stored for later
   * use.
   */
  var full_length = Math.ceil(input.length * 8 /
                                    (Math.log(encoding.length) / Math.log(2)));
  var remainders = Array(full_length);
  for(j = 0; j < full_length; j++)
  {
    quotient = Array();
    x = 0;
    for(i = 0; i < dividend.length; i++)
    {
      x = (x << 16) + dividend[i];
      q = Math.floor(x / divisor);
      x -= q * divisor;
      if(quotient.length > 0 || q > 0)
        quotient[quotient.length] = q;
    }
    remainders[j] = x;
    dividend = quotient;
  }

  /* Convert the remainders to the output string */
  var output = "";
  for(i = remainders.length - 1; i >= 0; i--)
    output += encoding.charAt(remainders[i]);

  return output;
}

/*
 * Encode a string as utf-8.
 * For efficiency, this assumes the input is valid utf-16.
 */
function str2rstr_utf8(input)
{
  var output = "";
  var i = -1;
  var x, y;

  while(++i < input.length)
  {
    /* Decode utf-16 surrogate pairs */
    x = input.charCodeAt(i);
    y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
    if(0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF)
    {
      x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
      i++;
    }

    /* Encode output as utf-8 */
    if(x <= 0x7F)
      output += String.fromCharCode(x);
    else if(x <= 0x7FF)
      output += String.fromCharCode(0xC0 | ((x >>> 6 ) & 0x1F),
                                    0x80 | ( x         & 0x3F));
    else if(x <= 0xFFFF)
      output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
                                    0x80 | ((x >>> 6 ) & 0x3F),
                                    0x80 | ( x         & 0x3F));
    else if(x <= 0x1FFFFF)
      output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
                                    0x80 | ((x >>> 12) & 0x3F),
                                    0x80 | ((x >>> 6 ) & 0x3F),
                                    0x80 | ( x         & 0x3F));
  }
  return output;
}

/*
 * Encode a string as utf-16
 */
function str2rstr_utf16le(input)
{
  var output = "";
  for(var i = 0; i < input.length; i++)
    output += String.fromCharCode( input.charCodeAt(i)        & 0xFF,
                                  (input.charCodeAt(i) >>> 8) & 0xFF);
  return output;
}

function str2rstr_utf16be(input)
{
  var output = "";
  for(var i = 0; i < input.length; i++)
    output += String.fromCharCode((input.charCodeAt(i) >>> 8) & 0xFF,
                                   input.charCodeAt(i)        & 0xFF);
  return output;
}

/*
 * Convert a raw string to an array of little-endian words
 * Characters >255 have their high-byte silently ignored.
 */
function rstr2binl(input)
{
  var output = Array(input.length >> 2);
  for(var i = 0; i < output.length; i++)
    output[i] = 0;
  for(var i = 0; i < input.length * 8; i += 8)
    output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (i%32);
  return output;
}

/*
 * Convert an array of little-endian words to a string
 */
function binl2rstr(input)
{
  var output = "";
  for(var i = 0; i < input.length * 32; i += 8)
    output += String.fromCharCode((input[i>>5] >>> (i % 32)) & 0xFF);
  return output;
}

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length.
 */
function binl_md5(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);
}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}
