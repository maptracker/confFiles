### TOR Browser profile support

It looks like the `profile.default` directory was originally in
`$HOME/tor-browser_en-US/`, but then moved to
`$HOME/tor-browser_en-US/Browser/TorBrowser/Data/Browser/`. The
`linkConfFiles.sh` script will make a symlink to normalize the browser
location to `$HOME/tor-browser_en-US` if needed.

