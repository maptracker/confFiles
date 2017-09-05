#!/bin/bash

## Identify the path to the user's default Firefox profile folder

# Ugly, probably a better way to parse a conf file.

MOZDIR="$HOME/.mozilla/firefox"
PROFILE0=`egrep '^(\[Profile0\]|Path=)' \
   "$MOZDIR/profiles.ini" |\
   egrep -A1 Profile0 | tail -n 1 | sed 's/.*=//' `

if [[ -z `echo "$PROFILE0" | grep '\\/'` ]]; then
    ## relative profile path
    PROFILE0="$MOZDIR/$PROFILE0"
fi

export PROFILE0="$PROFILE0"

[[ ! -z $1 ]] && echo "$PROFILE0"

