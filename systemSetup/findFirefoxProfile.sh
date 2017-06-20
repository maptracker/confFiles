#!/bin/bash

## Identify the path to the user's default Firefox profile folder

# Ugly, probably a better way to parse a conf file.

export PROFILE0=`egrep '^(\[Profile0\]|Path=)' ~/.mozilla/firefox/profiles.ini | egrep -A1 Profile0 | tail -n 1 | sed 's/.*=//' `

[[ ! -z $1 ]] && echo "$PROFILE0"

