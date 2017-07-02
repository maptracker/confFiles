#/bin/bash


## Loop increment: https://stackoverflow.com/a/18828335
## Loop increment with variable:
##   http://ahmed.amayem.com/bash-arrays-2-different-methods-for-looping-through-an-array/
## Working with xpis from command line: https://askubuntu.com/a/73480

browser=${1:-"firefox"}
profile=${2:-`ls -1d ~/.mozilla/firefox/*.default`}
          
tmp="/tmp/setupFirefox"
mkdir -p "$tmp"
cd "$tmp"
baseUrl="https://addons.mozilla.org/firefox/downloads/latest"

echo "
Downloading and installing addons for $browser
   Temp dir: $tmp
     Source: $baseUrl
    Browser: $browser
    Profile: $profile
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

rdf="install.rdf"
locrdf="/tmp/setupFirefox/$rdf"

if [[ -e "$rdf" ]]; then
    rm --force "$rdf"
    if [[ -e "$rdf" ]]; then
        echo "ERROR: can not remove $tmp/$rdf"
        exit
    fi
fi

## Now install all, which will require confirmation for each
for ((i=0; i<$xlen; i += 2));
do
    id=${xpis[$i]}
    nm=${xpis[$i+1]}
    rm --force "$rdf"
    locName="addon-${id}-latest.xpi"

    unzip -q "$locName" "$rdf"
    if [[ ! -s "$locrdf" ]]; then
        echo "
ERROR: Failed to extract $rdf from xpi
 name: $nm
  xpi: $locName
"
        exit;
    fi

    ## Sometimes <id> is used instead
    emid=`egrep '<(em:id|id)>' "$locrdf" | head -n1 | sed 's/<[^>]*>//g' | sed -r 's/[[:space:]]+//g'`
    if [[ -z "$emid" ]]; then
        echo "
ERROR: Failed to find xpi ID
  rdf: /tmp/setupFirefox/$rdf
"
        exit;
    fi
    xpi="$profile/extensions/$emid".xpi
    echo "
Installing: $nm
      Path: $xpi
"
    # sudo $browser -install-global-extension "$locName" "about:addons"
done
