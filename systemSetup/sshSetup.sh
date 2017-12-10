#!/bin/bash

## This script sets up SSH keys and attaches them to the agent:
##   1. Generates id_rsa if it does not already exist
##   2. Start the SSH agent if it's not already running
##   3. Add the key if it hasn't already been attached

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

my_dir="$(dirname "$0")"
## Make script path absolute: https://stackoverflow.com/a/4175545
## Normalize my_dir to be the confFiles directory:
my_dir=`readlink -f "$my_dir"/..`
. "$my_dir/systemSetup/_util_functions.sh"


keyFile="$HOME/.ssh/id_rsa"

if [[ -s "$keyFile" ]]; then
    msg "102;34" "
Keyfile already exists:
  $keyFile
Random art:"
    echo
    ## Show randomart: https://askubuntu.com/a/184552
    ssh-keygen -lv -f "$keyFile"
else
    ## Generate new SSH key
    msg "35" "
Setting up SSH keys and adding to agent
  $keyFile
"
    my_host=`hostname`
    ssh-keygen -t rsa -b 4096 -f "$keyFile" -C "$my_host"

fi

## Isolate the fingerprint, we will use it to verify it has been added.
foundKey=`ssh-keygen -l -f "$keyFile"`
keyFingerprint=`echo "$foundKey" | egrep -o "SHA256:[A-Za-z0-9]"\+`
if [[ -z "$keyFingerprint" ]]; then
    msg "31;43" "
[!!] Failed to determine your key fingerprint!
     This is probably because I am presuming  it starts with 'SHA256'
     Here is what I found:
       $foundKey
     Exiting...
"
    exit
fi


if [[ -z "$SSH_AGENT_PID" ]]; then
    ## Check if agent is running: https://stackoverflow.com/a/40549864
    eval $(ssh-agent -s)
    if [[ -z "$SSH_AGENT_PID" ]]; then
        msg "31;43" "
[!!] Failed to start SSH agent!
     Exiting...
"
        exit
    else
        msg "46;0;35" "
SSH agent has been started
  PID $SSH_AGENT_PID"
        echo
    fi
else
    msg "102;34" "
SSH agent is already running
  PID $SSH_AGENT_PID"
    echo
fi

## Check if key is added to agent: https://unix.stackexchange.com/a/58977
keyThere=`ssh-add -l | egrep -o "$keyFingerprint"`
if [[ -z "$keyThere" ]]; then
    msg "35" "
Adding your key to the agent - you will be asked for your passphrase
"
    ssh-add "$keyFile"
    keyThere=`ssh-add -l | egrep -o "$keyFingerprint"`
    if [[ -z "$keyThere" ]]; then
        msg "31;43" "
[!!] Apparently failed to add your key to the agent...
     Exiting...
"
        exit
    fi
else
    msg "102;34" "
Your key is already added to the agent:
  $keyFingerprint"
    echo
fi

msg "34;103" "
Your key is available and attached to the agent.
  To test GitHub:   ssh -T git@github.com
  Remote hosts should be given your public key:"

pub=`cat "$keyFile".pub`

msg "36" "
$pub
"
