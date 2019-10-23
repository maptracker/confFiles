#!/bin/bash

## This script sets up SSH keys and attaches them to the agent:
##   1. Generates id_rsa if it does not already exist
##   2. Start the SSH agent if it's not already running
##   3. Add the key if it hasn't already been attached

## It has one optional argument, which will be the name of the key
## file in ~/.ssh . By default 'id_rsa' will be used.

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

## Make sure id_rsa is established, that the SSH agent is running
## https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/

keyName=${1:-id_rsa}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    ## Determine if script has been sourced:
    ##   https://stackoverflow.com/a/2684300
    echo "

To properly attach the ssh-agent to your current shell, you need to
*source* this script, rather than simply running it. To do so, call
the script with a period and whitespace ('. ') at the front of the
script, eg:

. $0 '$keyName'

"
    exit
fi

## Normalize location of source file (which I sometimes symlink)
srcPath="${BASH_SOURCE[0]}"
if [[ -n "$(which realpath)" ]]; then
    srcPath="$(realpath "$srcPath")"
fi

## script folder: https://stackoverflow.com/a/246128
my_dir="$( cd "$( dirname "$srcPath" )" && pwd )"
utilFunc="$my_dir/../../generalUtilities/_util_functions.sh"

if [[ -e "$utilFunc" ]]; then
    ## Source in the utility functions, here used for colorized messaging
    . "$utilFunc"
else
    ## Stop after warning the user the util script will be needed:
    echo "

This script expects a set of utility functions at this location:

  $utilFunc

The file can be downloaded here:

  https://raw.githubusercontent.com/VCF/generalUtilities/master/_util_functions.sh

"
    return
fi

keyFile="$HOME/.ssh/$keyName"

otherKeys=""
## Note other key files that are also on the system
for ok in "$HOME/.ssh/"*.pub ; do
    pubOk=$(echo "$ok" | sed 's/.pub$//')
    bok=$(basename "$pubOk")
    if [[ "$bok" != "$keyName" ]]; then
        otherKeys="$otherKeys\n  $bok"
    fi
done

if [[ "$otherKeys" != "" ]]; then
    msg "$FgCyan" "\nOther SSH keys available on this account:$otherKeys\n"
fi

## Do we need to make the keyfile?
if [[ -s "$keyFile" ]]; then
    msg "102;$FgBlue" "
Keyfile already exists:
  $keyFile
Random art:"
    echo
    ## Show randomart: https://askubuntu.com/a/184552
    ssh-keygen -lv -f "$keyFile"
else
    ## Generate new SSH key
    msg "$FgMagenta" "
Setting up SSH keys and adding to agent
  $keyFile

    It is strongly recommended you use a passphrase to protect the
    private key, but of course you need to remember or record it for
    the key to be used later."
    echo
    my_host=$(hostname)
    ssh-keygen -t rsa -b 4096 -f "$keyFile" -C "$my_host"

fi

## Isolate the fingerprint, we will use it to verify it has been added.
foundKey=$(ssh-keygen -l -f "$keyFile")
## The fingerprint will have bits first, then the fingerprint string,
## which varies depending on the encoding algorithm used:
keyFingerprint=$(echo "$foundKey" | egrep -o "[0-9]{3,4} (SHA256:[A-Za-z0-9\+]+|[:a-f0-9]+)" | sed 's/^[0-9]* //')
if [[ -z "$keyFingerprint" ]]; then
    msg "$FgRed;$BgYellow" "
[!!] Failed to determine your key fingerprint!
     This is probably because I am presuming  it starts with 'SHA256'
     Here is what I found:
       $foundKey
     Exiting...
"
    return
fi


## Is the SSH agent running?
if [[ -z "$SSH_AGENT_PID" ]]; then
    ## Check if agent is running: https://stackoverflow.com/a/40549864
    eval $(ssh-agent -s)
    if [[ -z "$SSH_AGENT_PID" ]]; then
        msg "$FgRed;$BgYellow" "
[!!] Failed to start SSH agent!
     Exiting...
"
        return
    else
        msg "$BgCyan;0;$FgMagenta" "
SSH agent has been started
  PID $SSH_AGENT_PID"
        echo
    fi
else
    msg "102;$FgBlue" "
SSH agent is already running
  PID $SSH_AGENT_PID"
    echo
fi

## Check if key is added to agent: https://unix.stackexchange.com/a/58977
keyThere=$(ssh-add -l | grep -oF "$keyFingerprint")

if [[ -z "$keyThere" ]]; then
    msg "$FgMagenta" "
Adding your key to the agent - you will be asked for your passphrase
"
    ssh-add "$keyFile"
    keyThere=$(ssh-add -l | grep -oF "$keyFingerprint")
    if [[ -z "$keyThere" ]]; then
        msg "$FgRed;$BgYellow" "
[!!] Apparently failed to add your key to the agent...
     Exiting...
"
        return
    fi
else
    msg "102;$FgBlue" "
Your key is already added to the agent:
  $keyFingerprint"
    echo
fi

msg "$FgBlue;103" "
Your key is available and attached to the agent.
  Remote hosts should be given your public key:"

pub=$(cat "$keyFile".pub)

msg "$FgCyan" "
$pub"

wai=$(whoami)

## ssh-copy-id: https://askubuntu.com/a/875058
msg "$FgBlack;$BgWhite" "
Usage examples:
         Test GitHub:   ssh -T git@github.com
   Multiple SSH keys:   https://stackoverflow.com/a/3828682
  Add to remote host:   ssh-copy-id -i ${keyFile}.pub ${wai}@<hostname>
                        ## Host needs 'PasswordAuthentication yes' in /etc/ssh/sshd_config"
echo
