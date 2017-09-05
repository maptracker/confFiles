#!/bin/bash

## When working with a profile that I've not synched yet to this repo,
## I make a subdirectory called 'ts' ('temp styles'), copy
## dumpStylishStyles.pl, and run "dump run". I then want to compare
## those styles to what's in the repo, to see if there are any rules
## to move over. This script makes that easier

main_dir="$(dirname "$0")"
 . "$main_dir/../systemSetup/_util_functions.sh"

repoDir="$main_dir/styles"
browserDir="$main_dir/ts/styles"


[[ ! -d "$browserDir"  ]] && die "This script expects a 'ts/styles' folder here:
   $browserDir
"
style="$1"

if [[ -z "$style" ]]; then
    err "Pass the name of the style you want to compare. Available:" 
    ## https://stackoverflow.com/a/1252191 # replace newlines
    ## https://www.cyberciti.biz/tips/linux-unix-word-wrap-command.html
    ls "$browserDir" | sed "s/\\.css/ /" | sed ':a;N;$!ba;s/\n/ /g' | fold -s
    echo""
    exit
fi

css="${style}.css";
rcss="$repoDir/$css"
bcss="$browserDir/$css"

echo ""
if [[ -s "$rcss" ]]; then
    msg 42 "From repository:"
    cat "$rcss"
    echo ""
elif [[ ! -s "$bcss" ]]; then
    err "That style is in neither the repo nor the browser dump"
    exit
else
    msg 42 "Not present in repository!"
fi

if [[ -s "$bcss" ]]; then
    msg 43 "From browser dump:"
    cat "$bcss"
    echo ""
    if [[ -s "$rcss" ]]; then
        msg 34 "

   ## Edit the repository file to merge any rules:
   emacs $rcss

"
        else
        msg 34 "

   ## Copy the browser rules to the repository and clean up:
   cp $bcss $rcss && emacs $rcss

"
       
    fi
else
    msg 43 "Not present in browser!"
fi


