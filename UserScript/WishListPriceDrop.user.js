// ==UserScript==
// @name        Filter Amazon Wish List
// @namespace   Violentmonkey Scripts
// @match       https://www.amazon.com/hz/wishlist/*
// @grant       none
// @version     1.0
// @author      Charles Tilford
// @description Hides any items in Amazon wish list that have NOT dropped in price
// ==/UserScript==

/*

A long Amazon wish list won't fully render - it pulls in entries only
when you scroll to the end of the page. Filtering will prevent
Amazon's code from detecting that you're "at the end", so your list
will not fully load. To prevent this, keep hitting your keyboard's
[End] key (or scroll down, but [End] is faster) until you see "-- End
of list --", then hit [Home] and click the filter button.
  
 */

addButton();

function filterDropped () {
    // Hides any list memebers that don't have the 'Price Dropped'
    // span in them
    var items = document.getElementsByClassName('g-item-sortable');
    for (var i = 0; i < items.length; i++) {
        item = items[i];
        chk = item.getElementsByClassName('itemPriceDrop');
        if (chk.length == 0) {
            // No matching span found, hide the element
            item.style.display = "none";
        }
    }
}

function addButton () {
    // Adds a green button at top of wish list
    var par = document.getElementById('profile-list-name');
    if (!par) return;
    var but = document.createElement('button');
    but.innerText = "Show only price drops";
    but.style.backgroundColor = "Lime";
    // alert(but)
    // but.setAttribute("onclick", "filterDropped()");
    but.onclick = filterDropped;
    par.parentNode.appendChild(but);
}

