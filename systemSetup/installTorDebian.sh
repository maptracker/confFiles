#!/bin/bash


### ARG THIS IS *TOR*, NOT THE *BROWSER*
### EVERY. SINGLE. TIME. That's why I want a script for this...
### Commit, then start over...


# https://www.torproject.org/docs/debian.html.en#ubuntu

VERS="$1"

SRCS="/etc/apt/sources.list"
IsThere=`grep torproject "$SRCS"`

if [[ ! -z "$IsThere" ]]; then
    echo "
It looks like you already have torproject sources registered?

  $SRCS :

$IsThere

"
    exit
fi

if [[ -z "$VERS" ]]; then
    # https://en.wikipedia.org/wiki/Ubuntu_version_history#Table_of_versions
    echo "
Please specify the *Debian* version that your operating system uses:

10.04 LTS 	lucid
12.04 LTS 	precise
14.04 LTS 	trusty
16.04 LTS 	xenial

To find your system's codenname, run:

  lsb_release -a

"
    exit
fi

echo "
Adding to $SRCS
 ... You will be prompted for your password if not already authenticated.
"

echo "
## Tor Browser repository - via ~/confFiles/systemSetup/installTorDebian.sh
deb http://deb.torproject.org/torproject.org $VERS main
deb-src http://deb.torproject.org/torproject.org $VERS main
" | sudo tee -a "$SRCS"

echo "
Adding GPG key - should identify as deb.torproject.org archive signing key
"

gpg --keyserver keys.gnupg.net --recv A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89
gpg --export A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89 | sudo apt-key add -

echo "
Installing keyring
"

