#!/bin/bash

## The version of R in my system's repo (14.04 LTS) is ancient...
## Code to install from source.

## Can pass an alternative version as first argument. Browse here:
##     https://cran.rstudio.com/src/base/
VERS=${1:-"3.4.3"}
MAJVERS=`echo $VERS | cut -c1` ## "1.2.3" -> "1"

## Block comments: https://stackoverflow.com/a/947936
: <<'COMMENTBLOCK'

      Adventures encountered while compiling
            (generally in configure)

#######################################
###### 3.4.3 on Mint 18.3 Sylvia ######

### configure: error: No F77 compiler found
## https://stackoverflow.com/a/17721091

     sudo apt-get install gfortran

### configure: error: C++ preprocessor "/lib/cpp" fails sanity check
## https://askubuntu.com/a/509671

     sudo apt-get install g++

### error: --with-readline=yes (default) and headers/libs are not available
## https://stackoverflow.com/a/25691602

     sudo apt-get install libreadline-dev

### error: --with-x=yes (default) and X11 headers/libs are not available
## https://stackoverflow.com/a/25691602

     sudo apt-get install xorg-dev


### error: bzip2 library and headers are required

     ## DID NOT WORK sudo apt-get install lbzip2


##########################################
###### 3.4.1 on Ubuntu 14.04 LTS #########
I needed to install two Dev packages to get through ./configure :

     sudo apt-get install libxt-dev liblzma-dev

Dependency Details:

### checking for X11/Intrinsic.h... no
## https://packages.ubuntu.com/search?suite=trusty&arch=any&mode=exactfilename&searchon=contents&keywords=X11%2FIntrinsic.h

     sudo apt-get install libxt-dev

### configure: error: "liblzma library and headers are required"
## liblzma5 was installed already ...
## Nope, didn't help: sudo apt-get install lzma

     sudo apt-get install liblzma-dev

COMMENTBLOCK
##############################################

## script folder: https://stackoverflow.com/a/246128
my_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
. "$my_dir/../generalUtilities/_util_functions.sh"

## https://askubuntu.com/a/798342

msg 31 "
Requesting R version $VERS from RStudio
"

cd /tmp/

dir="R-${VERS}"
tgz="${dir}.tar.gz"
here=`pwd`

if [[ -s "$tgz" ]]; then
    msg 36 "    > Already downloaded"
else
    URL="https://cran.rstudio.com/src/base/R-${MAJVERS}/$tgz"
    msg 35 "Fetching: $URL"
    wget "$URL"
    [[ ! -s "$tgz" ]] && die "
Failed to download: $tgz
"
fi

if [[ -d "$dir" ]]; then
    msg 36 "    > Already extracted"
else
      msg 35 "Extracting: $tgz"
      tar xvf "$tgz"
      [[ ! -d "$dir" ]] && die "
Failed to extract $here/$tgz
    Directory not found: $dir
"
fi

cd "$dir"
here=`pwd`

msg 35 "Configuring ..."
./configure || die "
[?] Problem with $here/configure
"

msg 35 "Making ..."
make || die "
[?] Problem with $here/make
"

msg 35 "Make install ... As root ..."
sudo make install || die "
[?] Problem with $here/make install
"

msg "42;37" "
Installation successful!
"
exit

