#!/bin/bash

NOTES="

In summer 2026 Reddit gutted their 'old' interface (forced account
creation to use). For a variety of reasons, this has made maintenance
of my subreddit UserCSS blacklist problematic. I am also concerned
that fixes I apply now will be broken by future site updates. This
script is designed to abstract blacklist maintenace of the UserCSS.

"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"


## The actuall user script file:
RCSS="${SCRIPT_DIR}/Reddit.user.css"
## Source of individual blacklisted subreddits
BL="${SCRIPT_DIR}/MaskedSubreddits.txt"
## A temp file we'll build
RTMP="${RCSS}.tmp"

## Calculate the version for the new file
VLINE=$(grep '@version' "$RTMP")
echo "Input  $VLINE"
nowVers=$(echo "$VLINE" | sed 's/.*\.//')
newVers=$((nowVers + 1))
VNEW=$(sed "s/\.$nowVers$/.$newVers/" <<< "$VLINE")

## Build the new file
## Grab the 'top' of the file
awk '{
    print
    if (index($0, "SUBREDDIT START")) exit
}' "$RCSS" > "$RTMP"

## Now build the blacklist, one line at a time
while IFS= read -r line; do
    echo "    shreddit-post[subreddit-name=\"$line\"], div[data-subreddit=\"$line\"]," >> "$RTMP"
done < "$BL"
## Finall CSS rule
echo "    dummyObjectToDealWithTrailingComma {
        display: none ! important;
    }" >> "$RTMP"

## Finalize with the 'bottom' of the file
# Print from the first line containing FOOBAR through the end
awk '
    index($0, "SUBREDDIT END") { found = 1 }
    found { print }
' "$RCSS" >> "$RTMP"

## Finally, update the version number and write to actual file

cat "$RTMP" | sed "s/$VLINE/$VNEW/" > "$RCSS"


echo "
Output $VNEW
$RCSS
"
