#!/bin/bash

## Parses HTML from GOG to extract title IDs that are already in my
## collection (since the site lacks filters for this category)

## The page is built dynamically, so after the page loads:
##  Ctrl-A
##  Right-click:  View Selection Source
##  Ctrl-S save to file

HTML="$1"

[[ -z "$HTML" ]] && echo "Please provide 'raw' HTML file as the first argument" && exit

## Clean out HTML some (easier to inspect)
## Grep 8 lines before "in-library" class
## Grep just the title and ID
## s/e/d to make a CSS rule

egrep -v '^ *\/\/images' "$HTML" | \
    egrep -B 8 'labels--in-library' | \
    egrep -o 'cart-title.+cart-id="[0-9]+"' | \
    sed -E 's/.+="([^"]*)".*"([0-9]+)"/    *[product-tile-id="\2"], \/* \1 *\//'


echo ""
## Find soundtracks

egrep -i '(soundtrack|artbook)' "$HTML" | \
    egrep -o 'cart-title.+cart-id="[0-9]+"' | \
    sed -E 's/.+="([^"]*)".*"([0-9]+)"/    *[product-tile-id="\2"], \/* \1 *\//'
