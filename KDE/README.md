### KDE Files

File locations seem to depend on if you're using the older KDE4, or
KDE5 ("Plasma"). Places I've found to have KDE configuration files:

* `$HOME/.config`
* `$HOME/.local/share/` (app-specific subdirectories)
* `$HOME/.kde/share/config`

To find files managed by `../linkConfFiles.sh` in these areas, list
and look for symlinks to `confFiles`, eg:

```bash
ls -lh "$HOME/.config" | grep confFiles
```
