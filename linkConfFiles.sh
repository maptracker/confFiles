

my_dir="$(dirname "$0")"
## Make script path absolute: https://stackoverflow.com/a/4175545
my_dir=`readlink -f "$my_dir"`
. "$my_dir/systemSetup/_util_functions.sh"

FORCE="$1"

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
            msg "1;36" "Exists: $TRG -> $SRC"
        else
            err "Want:\n  $TRG -> $SRC\nHave:\n  $TRG -> $TRGC"
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

noisy_cd "$HOME"
CDIR="$my_dir"

## Basic conf files:
link "$CDIR/.tmux.conf"    ".tmux.conf"
link "$CDIR/.bashrc"       ".bashrc"
link "$CDIR/.emacs"        ".emacs"
link "$CDIR/.psqlrc"       ".psqlrc"
link "$CDIR/.bash_profile" ".bash_profile"

## FireFox 57 is MESSING EVERYTHING UP. Tiddlywikis now can only be
## loaded from a subfolder in ~/Downloads (WHY WHY WHY). Create
## symlink that points to filer location:
link "/abyss/Common/TW" "$HOME/Downloads/tiddlywikilocations"


## KDE files
kdir=".kde/share/apps/konsole"
mkdir -p "$kdir"
link "$CDIR/KDE/konsoleui.rc"   "$kdir/konsoleui.rc"
link "$CDIR/KDE/konsoleui.rc"   "$kdir/konsoleui.rc"

kdir=".kde/share/config"
mkdir -p "$kdir"
link "$CDIR/KDE/okularpartrc"   "$kdir/okularpartrc"
link "$CDIR/KDE/Shell.profile"  "$kdir/Shell.profile"


## Firefox stuff
FFPROF=`$my_dir/systemSetup/findFirefoxProfile.sh 1`
## Greasemonkey:
link "$my_dir/gm_scripts" "$FFPROF/gm_scripts"
## User styles:
mkdir -p "$FFPROF/chrome"
link "$my_dir/firefox/userChrome.css" "$FFPROF/chrome/userChrome.css"


TORPROF="$HOME/tor-browser_en-US/profile.default"
if [[ -d "$TORPROF" ]]; then
    ## Also manage TOR Browser
    link "$my_dir/gm_scripts" "$TORPROF/gm_scripts"
    mkdir -p "$TORPROF/chrome"
    link "$my_dir/firefox/userChrome.css" "$TORPROF/chrome/userChrome.css"
fi

msg "1;35" "
Finished.
"
