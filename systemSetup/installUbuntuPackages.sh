#!/bin/bash

logFile="/tmp/aptGetLog.txt"
echo "## apt-get install log" > "$logFile"
echo "## " `date` >> "$logFile"
echo "Progress will be written to:
  $logFile
"

## https://www.eff.org/deeplinks/2012/10/privacy-ubuntu-1210-amazon-ads-and-data-leaks
unwanted=(
    unity-lens-shopping 
    unity-lens-friends
    unity-lens-music
    unity-lens-photos
    unity-lens-video
)

for pk in "${unwanted[@]}"
do
    # https://askubuntu.com/a/423556 # Check if package is installed
    isThere=`dpkg -l "$pk" 2> /dev/null | grep -F "$pk" | grep -v "^un"`
    if [[ -z "$isThere" ]]; then
        echo "Happily absent: $pk"
        echo "Happily absent: $pk" >> "$logFile"
    else
        echo "Removing undesired package: $pk"
	echo "$bar" >> "$logFile"
        sudo dpkg --remove "$pk" >> "$logFile"
    fi
done

echo "
Installing packages...
"

desired=(
    htop
    openssh-client
    
    emacs
    git
    keepassx

    wine
    dosbox
    virtualbox

    nemo
    nemo-fileroller
    xz-utils
    
    inkscape
    gimp
    vlc
    feh
)


notAvailable=""
bar="#######################################################"
for pk in "${desired[@]}"
do
    # https://askubuntu.com/a/423556 # Check if package is installed
    isThere=`dpkg -l "$pk" 2> /dev/null | grep -F "$pk" | grep -v "^un"`
    if [[ -z "$isThere" ]]; then
	## The package is not installed. Is it available?
	## ... is there a better way than aptitude search?
	canGet=`aptitude search "$pk" | grep -F " $pk " `
	if [[ -z "$canGet" ]]; then
	    ## Nope
	    notAvailable="$notAvailable  $pk"
	    echo "Not available: $pk" >> "$logFile"
	else
	    echo "
Installing: $pk
"
	    echo "$bar" >> "$logFile"
	    sudo apt-get install -y "$pk" >> "$logFile"
	    echo -e "$bar\n\n" >> "$logFile"
	fi
    else
	echo "Already installed: $pk"
	echo "Already installed: $pk" >> "$logFile"
    fi
done

[[ ! -z "$notAvailable" ]] && \
    echo "
Some packages do not appear to be in the repository:
  $notAvailable
"

echo "
Installation log:
   less -S $logFile
"

