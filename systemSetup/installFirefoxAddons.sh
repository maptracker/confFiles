#/bin/bash


## Loop increment: https://stackoverflow.com/a/18828335
## Loop increment with variable:
##   http://ahmed.amayem.com/bash-arrays-2-different-methods-for-looping-through-an-array/
## Working with xpis from command line: https://askubuntu.com/a/73480

browser=${1:"firefox"}

tmp="/tmp/setupFirefox"
mkdir -p "$tmp"
cd "$tmp"
baseUrl="https://addons.mozilla.org/firefox/downloads/latest"

echo "
Downloading and installing addons for $browser
   Temp dir: $tmp
     Source: $baseUrl
"

xpis=(
    722    noscript
    748    greasemonkey
    1122   tab-mix-plus
    2108   stylish
    12781  ixquick-https-privacy-search-e
    328834 "disable-ctrl-q-shortcut/platform:2"
    355815 old-default-image-style
    393327 tiddlyfox
    472577 classicthemerestorer
    607454 ublock-origin
    613250 umatrix
)

xlen=${#xpis[*]}

## Download all at once first


## for i in {0..${xlen}..2} # bleh
for ((i=0; i<$xlen; i += 2));
do
    id=${xpis[$i]}
    nm=${xpis[$i+1]}
    locName="addon-${id}-latest.xpi"
    [[ -s "$locName" ]] && continue
    echo "Downloading: $locName ($nm)"
    url="$baseUrl/$nm/$locName"
    wget "$url"
    [[ ! -s "$locName" ]] && echo "
Failed to download XPI:
  $nm
  $url
" && exit 1

done

