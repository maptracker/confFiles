FORCE="$1"

## https://en.wikipedia.org/wiki/ANSI_escape_code#Colors
function msg () {
    COL=$1
    MSG=$2
    echo -e "\033[${COL}m${MSG}\033[0m\n"
}

function warn () {
    msg "1;33;41" "$1"
}

function err () {
    warn "$1"
    exit
}

function link () {
    # SRC = file in repository, TRG = where we will make a link
    SRC="$1"
    TRG="$2"
    if [ ! -f "$SRC" ]; then
        warn "Source file does not exist: $SRC"
        return
    fi
    if [ -L "$TRG" ]; then
        SRCC=`readlink -f "$SRC"`
        TRGC=`readlink -f "$TRG"`
        if [ "$SRCC" == "$TRGC" ]; then
            msg "1;36" "Exists: $TRG -> $SRC"
        else
            warn "Want:\n  $TRG -> $SRC\nHave:\n  $TRG -> $TRGC"
        fi
        return
    fi
    if [ -f "$TRG" ]; then
        # The file already exists
        if [ -z "$FORCE" ]; then
            # No request to force link creation
            warn "Target file already exists: $TRG"
            return
        else
            # We are going to force making the link
            BKUP="${TRG}-BKUP"
            mv -i "$TRG" "$BKUP" || err "Failed to move $TRG to $BKUP"
            msg "1;46" "Existing target $TRG backed up to $BKUP"
        fi
    fi
    CHKLINK=`ln -s "$SRC" "$TRG"`
    if [ -z "$CHKLINK" ]; then
        # Success - the file is now symlinked to the repo
        msg "1;34" "Create: $SRC -> $TRG"
    else
        err "Failed to create link:\n  $SRC -> $TRG\n  Error: $CHKLINK"
    fi
}

function noisy_cd () {
    cd "$1"
    msg "46;0;35" "Now in: "`pwd`
}

noisy_cd "$HOME"
CDIR="confFiles"

link "$CDIR/.tmux.conf" '.tmux.conf'
link "$CDIR/.bashrc"    '.bashrc'
link "$CDIR/.emacs"     '.emacs'
link "$CDIR/.psqlrc"    '.psqlrc'

gct="gconftool-2"
hasGconf=`which $gct`


gnomeTools=(
    gnome-terminal
)

if [[ -z "$hasGconf" ]]; then
    warn "$gct not present - not sure how to manipulate Gnome settings"
else
    msg "46;0;35" "
Manual steps for restoring Gnome configurations
   (not sure how to detect if changes have been made, or to live-link)
"

    ## Backup and restore with gconftool-2 :
    ## https://superuser.com/a/241570

    for gt in "${gnomeTools[@]}"
    do
        msg "44;33" "## $gt settings:"

        msg "36" "    $gct --dump '/apps/$gt' > \"$HOME/$CDIR/${gt}-conf.xml-BKUP\" # Backup
    $gct --load \"$HOME/$CDIR/${gt}-conf.xml\" # Restore
"
    done
fi
