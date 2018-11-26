#!/bin/bash

## Generate inline data: for PNG icon
## Yanked from my dynamictable R package:
##    https://github.com/maptracker/dynamictable/blob/master/inst/pngs/base64icon.sh

files=`ls -1 *.png`

for file in ${files[@]}; do
    echo -e "\n$file ::\n"

    base64 -w0 "$file"

    echo ""
done
