#!/bin/bash

## The version of R in my system's repo (14.04 LTS) is ancient...
## Code to install from source.

## Can pass an alternative version as first argument
VERS=${1:-"3.4.0"}
MAJVERS=`echo $VERS | cut -c1` ## "1.2.3" -> "1"

## Block comments: https://stackoverflow.com/a/947936
: <<'COMMENTBLOCK'

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

my_dir="$(dirname "$0")"
. "$my_dir/_util_functions.sh"

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

