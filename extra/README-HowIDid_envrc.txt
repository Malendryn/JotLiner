on my local machine the full path to the git toplevel is:
/mnt/local/envrc/node/project.jotliner  houses .git
/mnt/local/                             is my general purpose 'local' project and utility mountpoint
/mnt/local/envrc/                       houses a bunch of different .envrc-controlled subdirs for handling different projects
/mnt/local/envrc/node/                  has .envrc and .envrc_home rigged for vscode and tuned for nodejs, js, and html projects
                               


the .envrc file looks like this:  (as of this writing)
--------------------------------------------------------------------------------------------------------------------
REALHOME=$HOME                       # preserve current 'real' $HOME before mucking around
ZZZZZ=`pwd`                          # `pwd` always shows the dir that .envrc resides in, perfect!
export HOME="${ZZZZZ}/.envrc_home"   # change our perception of HOME to the new <project>/.envrc_home
ZZZZZ=`mkdir -p "${HOME}/bin"`       # create <project>/.envrc_home (now $HOME,) and $HOME/bin if they don't already exist 

### we USED TO use $RAWPATH which is set in .profile and is the $PATH before $SREALHOME/bin was added
### but NOW we leave $HOME/bin added, so that all the progs in there are still valid, but prepend that path with our .envrc home
### so that THOSE commands if-present can/will be overridden
### # export PATH=$HOME/bin:$RAWPATH       # add bin dir into the path  (auto-resets upon exiting direnv ctrled subdir)

export PATH=$HOME/bin:$PATH       # add bin dir into the path  (auto-resets upon exiting direnv ctrled subdir)


#######################################################################################################################
#######################################################################################################################

#### the following 'JUNK='s are 'tricks' that use `exec` nature of backticks to execute cmds on entering a direnv ctrled subdir
#### these are generic, COMMENT OUT the ones you don't want and CHANGE THE PATH to change the versions to link to

JUNK=`ln -s "${REALHOME}/.gitconfig" "$HOME/.gitconfig" 2> /dev/null`                        # softlink stuff from our real $HOME to new $HOME here

JUNK=`ln -s "/mnt/shared/vbin/vscode/VSCode-1.97.1/bin/code" "$HOME/bin/code" 2> /dev/null`  # create versioned link to vscode to $HOME/bin/code

#### ZZZ=$QQQ        # example: we can assign one ENVval from another in here
#### ZZZ=`cat $ZZZ`  #          and then use that newly assigned ENVval as an executable param!
--------------------------------------------------------------------------------------------------------------------
