### Configuration files

Appears that all configuration can be captured in two files

* `$HOME/.kde/share/apps/konsole/konsoleui.rc`
* `$HOME/.kde/share/config/konsolerc`
* Can also utilitze a [CSS stylesheet][css] for tab styling.

### Shortcuts

Can all be reconfigured in `Settings` / `Configure Shortcuts...`

* Copy / Paste (Clipboard): `Ctrl-Shift-C` / `Ctrl-Shift-V`
* Zoom: `Ctrl-+` and  `Ctrl--`
* Close tab / Close all: `Ctrl-Shift-W` / `Ctrl-Shift-Q`
    * Not sure of consequences of this? Presume forced exit
* New tab / New Window: `Ctrl-Shift-T` / `Ctrl-Shift-N`
* Detach tab: `Ctrl-Shift-H`
* Rename tab: `Ctrl-F2` _my rebinding_
* Next tab / Previous tab: `Ctrl-Right` / `Ctrl-Left`
* Move tab left / right: `Ctrl-Shift-Left` / `Ctrl-Shift-Right`
* Find / Find Next / Find Previous: `Ctrl-Shift-F` / `F3` / `Shift-F3`
* [Rectangular select][Rect]: `Ctrl-Alt-LeftMouse`
* Activity monitor: `Ctrl-Shift-A`


### Limitations

* Can not change tab text color on activity ([source][ActivityColor])

[css]: https://docs.kde.org/trunk5/en/applications/konsole/tabbarstylsheet.html
[Rect]: https://unix.stackexchange.com/a/91149
[ActivityColor]: https://stackoverflow.com/a/33482509
