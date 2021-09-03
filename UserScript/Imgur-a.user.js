// ==UserScript==
// @name         Imgur Expander
// @namespace    https://github.com/maptracker/confFiles/tree/master/UserScript
// @description  Extract individual media from Imgur pages
// @author       You
// @match        https://imgur.com/a/*
// @icon         https://www.google.com/s2/favicons?domain=imgur.com
// @grant        none
// @version      1.0.3
// ==/UserScript==

(function() {
    'use strict';

    /* 
     Got tired of Imgur demanding increasing domains to show
     images. Scraping their JSON structure and adding media manually
     to pages. Pages load MUCH faster, and with significantly lower
     resource usage.
    */

    // Container to hold images:
    var dest = document.createElement("div");
    document.body.insertBefore(dest, document.body.firstChild);
    dest.style.width="800px";
    dest.style.padding="6px";

    // JSON object created by Imgur
    var jtxt = window.postDataJSON;
    if (!jtxt) {
        dest.textContent = "No JSON structure found";
        return;
    }
    var jdat = JSON.parse(jtxt);
    var jmed = jdat.media;
    if (!jmed) {
        dest.textContent = "No media component found";
        return;
    }
    var len = jmed.length;
    if (len == 0) {
        dest.textContent = "Media component has zero elements";
        return;
    }
    // It appears to reference media. 
    //alert(JSON.stringify(jmed, null, 1));
    var isImg = new RegExp('.+\.(jpg|jpeg|gif|png)$', 'i');
    var isVid = new RegExp('.+\.(mp4)$', 'i');
    // Cycle through each entry
    var success = 0;
    for (var i=0; i < len; i++) {
        var url = jmed[i].url;
        if (!url) continue;
        // Create a container for the object
        var bit = document.createElement("div");
        var nm = document.createElement("div");
        nm.textContent = jmed[i].description;
        bit.append(nm);
        nm.style.backgroundColor = "#bbbb00";
        nm.style.padding = "3px";
        var obj;
        if (isImg.test(url)) {
            // Looks to be an image
            obj = document.createElement("img");
            obj.src = url;
            obj.style.width="100%"
        } else if (isVid.test(url)){
            // Video
            obj = document.createElement("video");
            // obj.style.width="100%"
            obj.autoplay=false;
            obj.preload=true;
            obj.style.objectFit="contain";
            obj.controls = "controls";
            //obj.type="video/mp4";
            var vo = document.createElement("source");
            vo.src = url;
            obj.append(vo);
        } else {
            // Not sure how to handle, make link
            obj = document.createElement("a");
            obj.href = url;
            obj.textContent = url;
        }
        bit.append(obj);
        dest.append(bit);
        success++;
    }
    if (success == 0) {
        dest.textContent = "No components found to add to page";
        return;
    }

})();
