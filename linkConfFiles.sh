#!/bin/bash

## This script manages configuration files held in the symlinks/
## folder that accompanies the script. The subfolder structure will be
## preserved, anchored in $HOME.

##   1. Some dynamic symlinks are made:
##      * stndProfile pointing to the presumed FireFox profile
##      * Normalization of the TOR browser profile folder
##   2. The starting directory (symlinks/) is scanned for files and
##      links. They are symlinked into $HOME.
##      * . and .. are excluded
##      * Text editor backup files are excluded
##      * READMEs are excluded
##      * If ${FILE}-NoLink exists, no link is made
##   3. Each subfolder is then recursively analyzed
##      * The target location in $HOME will be under the relevent subdir
##      * If the subfolder contains a file '.asDir', then a symlink will
##        be generated directly to the subfolder (no recursion)

## Copyright (C) 2017 Charles A. Tilford
##   Where I have used (or been inspired by) public code it will be noted

LICENSE_GPL3="

    This program is free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see http://www.gnu.org/licenses/

"

## script folder: https://stackoverflow.com/a/246128
my_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
. "$my_dir/generalUtilities/_util_functions.sh"

FORCE="$1"
export LINKDIR="$my_dir/symlinks"
msg "35" "
LINKDIR=$LINKDIR
"

function link () {
    # SRC = file in repository, TRG = where we will make a link
    SRC="$1"
    TRG="$2"
    if [ -d "$SRC" ]; then
        msg 37 "  Source is dir: $SRC"
    elif [ ! -f "$SRC" ]; then
        err "Source file does not exist: $SRC"
        return
    fi
    if [ -L "$TRG" ]; then
        SRCC=`readlink -f "$SRC"`
        TRGC=`readlink -f "$TRG"`
        if [ "$SRCC" == "$TRGC" ]; then
            ## sed with slashes: https://unix.stackexchange.com/a/39802
            TH=`setTilda "$TRG"`
            SH=`setTilda "$SRC" "$LINKDIR" "LINKDIR"`
            msg "1;36" "Exists: $TH -> \$$SH"
        else
            err "Want:  $TRG -> $SRC\nHave:  $TRG -> $TRGC"
            echo
        fi
        return
    fi
    if [ -f "$TRG" ] || [ -d "$TRG" ]; then
        # The file already exists
        BKUP="${TRG}-BKUP"
        if [ -z "$FORCE" ]; then
            # No request to force link creation
            err "Target file already exists: $TRG
  Pass a true value to the script to force creation of link
    Forcing will create a backup of the target under: $BKUP"
            return
        else
            # We are going to force making the link
            mv -i "$TRG" "$BKUP" || die "Failed to move $TRG to $BKUP"
            msg "1;46" "Existing target $TRG backed up to $BKUP"
        fi
    fi

    ## Allow the presence of a local file with a "-NoLink" suffix to
    ## prevent replacement with a symlink, even when force is on:
    noLink="$TRG"-NoLink
    if [[ -e "$noLnk" ]]; then
        msg "33" "
NoLink file prevents linking of standard files
   Blocking file: $noLnk
  Ignored source: $SRC
"
        echo
        return
    fi
    
    CHKLINK=`ln -s "$SRC" "$TRG"`
    if [ -z "$CHKLINK" ]; then
        # Success - the file is now symlinked to the repo
        msg "1;34" "Create: $SRC -> $TRG"
    else
        die "Failed to create link:\n  $SRC -> $TRG\n  Error: $CHKLINK"
    fi
}

function noisy_cd () {
    cd "$1"
    msg "46;0;35" "Now in: "`pwd`
}

function link_dir () {
    ## Recursively crawls through $LINKDIR and links files into $HOME/
    srcdir="$1"
    relpath=`relativePath "$LINKDIR" "$srcdir"`
    ## Single level find: https://stackoverflow.com/a/2107982
    ## Loop with spaces:  https://stackoverflow.com/a/7039208
    find "$srcdir" -maxdepth 1 -mindepth 1 -type f -or -type l | while read srcfile
    do
        bn=`basename "$srcfile"`
        ## Ignore backup files
        bkup=`echo "$bn" | egrep '(^#|#$|~$)'`
        [[ -z "$bkup" ]] || continue
        ## Ignore support files
        isSup=`echo "$bn" | egrep -i '(readme)'`
        [[ -z "$isSup" ]] || continue
        
        targfile=`readlink -f "$HOME"/"$relpath"`/"$bn"

        #msg "31" "FILE: $srcfile -> $targfile" # && continue
        
        ## Normal file - make symlink at target location back to confFiles
        link "$srcfile" "$targfile"
    done

    ## Now recurse through the subdirectories
    find "$srcdir" -maxdepth 1 -mindepth 1 -type d | while read subdir
    do
        bn=`basename "$subdir"`
        ## Should not come up in find, but skip . and ..
        [[ "$bn" == '.' || "$bn" == '..' ]] && continue
        

        #msg "32" "DIR: $subdir -> $targfile" # && continue
        noRec="$subdir"/.asDir

        if [[ -e "$noRec" ]]; then
            ## The directory contains a '.asDir' file. This is a flag
            ## to indicate that the direcory should be linked
            ## directly, rather than analyzed by recursion
            relpath=`relativePath "$LINKDIR" "$subdir"`
            targfile=`readlink -f "$HOME"/"$relpath"`
            if [[ "$targfile" == "$subdir" ]]; then
                msg "1;34" "Dir Symlink exists: ~/$relpath/ -> \$LINKDIR/$relpath/"
            else 
                ## msg "33" "LINKDIR: $subdir ->\n   $targfile\n   [$relpath]" # && continue
                link "$subdir" "$targfile"
            fi
        else
            ## Recurse into directories
            link_dir "$subdir"
        fi
    done
}

## Symlink the FireFox profile to a standard symlink
FFPROF=`$my_dir/systemSetup/findFirefoxProfile.sh 1`
if [[ ! -z "$FFPROF" ]]; then
    bn=`basename "$FFPROF"`
    bd=`dirname "$FFPROF"`
    ln -sf "$bn" "$bd"/stndProfile
fi

## Normalize the TOR default profile directory
TORDIR="$HOME/tor-browser_en-US"
NEWTP="Browser/TorBrowser/Data/Browser/profile.default"
if [[ -d "$TORDIR/$NEWTP" ]]; then
    lnk="$TORDIR/profile.default"
    if [[ ! -d "$lnk" && ! -L "$lnk" ]]; then
        ln -sf "$NEWTP" "$lnk"
    fi
fi

## Build symlinks to mirrored structure in ./symlinks :
link_dir "$LINKDIR"

msg "1;35" "
Finished.
"
