#!/bin/bash

# ~/.bashrc: executed by bash(1) for non-login shells.
# see /usr/share/doc/bash/examples/startup-files (in the package bash-doc)
# for examples


#### chsh -s /bin/bash
## Done for:
# kraken

# I've pared down this file to be universal across machines I
# use. Machine-specific settings are put in ~/.bashrc-local.sh
XTRABASHRC="$HOME/.bashrc-local.sh"
[ -f "$XTRABASHRC" ] && . "$XTRABASHRC"

# If not running interactively, don't do anything
# This is defensive against complaints involving tput.
[ -z "$PS1" ] && return

ssh() {
    # ssh wrapper to allow tmux to set short hostname
    # https://gist.github.com/florianbeer/ee02c149a7e25f643491
    if [ "$(ps -p $(ps -p $$ -o ppid=) -o comm=)" = "tmux" ]; then
        # @florianbeer is using cut to get the short hosthame, but I
        # generally pass -X to ssh. This confuses the original
        # code. Use another trick with rev/rev to get the last
        # argument to ssh:
        # https://stackoverflow.com/a/22727211
        tmux rename-window \
            "$(echo $* | rev | cut -d ' ' -f1 | rev | cut -d . -f 1)"
        command ssh "$@"
        tmux set-window-option automatic-rename "on" 1>/dev/null
    else
        command ssh "$@"
    fi
}


# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# http://alexteichman.com/octo/blog/2014/01/01/x11-forwarding-and-terminal-multiplexers/
# -- Improved X11 forwarding through GNU Screen (or tmux).
# If not in screen or tmux, update the DISPLAY cache.
# If we are, update the value of DISPLAY to be that in the cache.
function update-x11-forwarding
{
    if [ -z "$STY" -a -z "$TMUX" ]; then
        echo $DISPLAY > ~/.display.txt
    else
        export DISPLAY=`cat ~/.display.txt`
    fi
}

# This is run before every command.
preexec() {
    # Don't cause a preexec for PROMPT_COMMAND.
    # Beware!  This fails if PROMPT_COMMAND is a string containing more than one command.
    [ "$BASH_COMMAND" = "$PROMPT_COMMAND" ] && return 

    update-x11-forwarding

    # Debugging.
    #echo DISPLAY = $DISPLAY, display.txt = `cat ~/.display.txt`, STY = $STY, TMUX = $TMUX  
}
trap 'preexec' DEBUG
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



gls() {
    # Seems I'm always less'ing gzipped data files...
    gunzip -c "$1" | less -S
}

alias myproc='ps -ef | grep tilfordc | egrep -v "(emacs|-tcsh|-bash|sshd:| grep | ps -ef| sort -k8)" | sort -k8'

# Disable Ctrl-s in terminals
# https://unix.stackexchange.com/a/12108
stty -ixon

# Include date and time in history output
export HISTTIMEFORMAT='%b%d %H:%M '

# ------------------------------------------------

# don't put duplicate lines in the history. See bash(1) for more options
# don't overwrite GNU Midnight Commander's setting of `ignorespace'.
export HISTCONTROL=$HISTCONTROL${HISTCONTROL+,}ignoredups
# ... or force ignoredups and ignorespace
export HISTCONTROL=ignoreboth

# append to the history file, don't overwrite it
shopt -s histappend

# for setting history length see HISTSIZE and HISTFILESIZE in bash(1)

# check the window size after each command and, if necessary,
# update the values of LINES and COLUMNS.
shopt -s checkwinsize

# make less more friendly for non-text input files, see lesspipe(1)
[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

# set variable identifying the chroot you work in (used in the prompt below)
if [ -z "$debian_chroot" ] && [ -r /etc/debian_chroot ]; then
    debian_chroot=$(cat /etc/debian_chroot)
fi

# set a fancy prompt (non-color, unless we know we "want" color)
case "$TERM" in
    xterm-color) color_prompt=yes;;
esac

# uncomment for a colored prompt, if the terminal has the capability; turned
# off by default to not distract the user: the focus in a terminal window
# should be on the output of commands, not on the prompt
#force_color_prompt=yes

if [ -n "$force_color_prompt" ]; then
    if [ -x /usr/bin/tput ] && tput setaf 1 >&/dev/null; then
	# We have color support; assume it's compliant with Ecma-48
	# (ISO/IEC-6429). (Lack of such support is extremely rare, and such
	# a case would tend to support setf rather than setaf.)
	color_prompt=yes
    else
	color_prompt=
    fi
fi

# http://tldp.org/HOWTO/Bash-Prompt-HOWTO/bash-prompt-escape-sequences.html
# http://www.cyberciti.biz/tips/howto-linux-unix-bash-shell-setup-prompt.html
# http://systhread.net/texts/200703bashish.php
# Red prompt:
#  PS1="\\[$(tput setaf 1)\\]\\u@\\h:\\w #\\[$(tput sgr0)\\]"

# Meh. Just color away... When TERM is xterm, it still appears to support color
#if [ "$color_prompt" = yes ]; then
if [[ "$USER" == "tilfordc" ]]; then
    PS1='\[\033[01;33m\]\h \#%\[\033[00m\] '
else
    # If su'ed as a different user, highlight UID
    PS1='\[\033[01;33m\]\h (\u) \#%\[\033[00m\] '
fi
#else
#    # PS1='\h \#% '
#    PS1='\[\033[01;33m\]\h \#%\[\033[00m\] '
#fi
unset color_prompt force_color_prompt

# If this is an xterm set the title to user@host:dir
# http://www.faqs.org/docs/Linux-mini/Xterm-Title.html#ss4.3
case "$TERM" in
xterm*|rxvt*)
    PS1="\[\e]0;\h\007\]$PS1"
    ;;
*)
    ;;
esac

# Alias definitions.
# You may want to put all your additions into a separate file like
# ~/.bash_aliases, instead of adding them here directly.
# See /usr/share/doc/bash-doc/examples in the bash-doc package.

#if [ -f ~/.bash_aliases ]; then
#    . ~/.bash_aliases
#fi

# enable color support of ls and also add handy aliases
if [ -x /usr/bin/dircolors ]; then
    eval "`dircolors -b`"
    alias ls='ls --color=auto'
    #alias dir='dir --color=auto'
    #alias vdir='vdir --color=auto'

    #alias grep='grep --color=auto'
    #alias fgrep='fgrep --color=auto'
    #alias egrep='egrep --color=auto'
fi

# some more ls aliases
#alias ll='ls -l'
#alias la='ls -A'
#alias l='ls -CF'

# enable programmable completion features (you don't need to enable
# this, if it's already enabled in /etc/bash.bashrc and /etc/profile
# sources /etc/bash.bashrc).
if [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
fi

# Yeahhh ... Some of this is not universally useful. In particular, ls
# coloring is (unsurprisingly) causing problems with some other shell
# scripts. Allow the presence of *another* machine-specific file to
# undo some of the above

POSTBASHRC="$HOME/.bashrc-finish.sh"
[ -f "$POSTBASHRC" ] && . "$POSTBASHRC"
