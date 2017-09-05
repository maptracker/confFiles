# .bash_profile

## Assure .bashrc is loaded for SSH sessions
# https://stackoverflow.com/a/820533
if [ -f ~/.bashrc ]; then
    . ~/.bashrc
fi

# User specific environment and startup programs

PATH=$PATH:$HOME/bin

export PATH
unset USERNAME
