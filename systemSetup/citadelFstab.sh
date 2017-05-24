#!/bin/bash

## Sets up file server mounts

# Local root mounting point:
rootPoint="/abyss"
# Subdirectories (exports) to mount:
subdirs=(Common Installers Media)
# Remote NFS server:
host="citadel"

[[ ! -d "$rootPoint" ]] && \
    echo "Creating mount root: $rootPoint" && \
    sudo mkdir -m 0777 -p "$rootPoint"

## Make sure NFS is installed
needPkg=(nfs-common)
for pk in "${needPkg[@]}"
do
    # https://askubuntu.com/a/423556 # Check if package is installed
    isThere=`dpkg -l "$pk" | grep -F "$pk"`
    if [[ -z "$isThere" ]]; then
	echo "Installing package: $pk"
	sudo apt-get install -y "$pk"
    fi
done

fstab="/etc/fstab"
bkupFstab="/etc/fstab-BKUP"
## Make each subdirectory
for sd in "${subdirs[@]}"
do
    subdir="$rootPoint/$sd"
    [[ ! -d "$subdir" ]] && \
	echo "Creating subdirectory mount: $subdir" && \
	sudo mkdir -m 0777 -p "$subdir"
    cmd="$host:$subdir $subdir nfs"
    isThere=`grep -F "$cmd" "$fstab"`
    if [[ -z "$isThere" ]]; then
	
	## We need to add an entry in fstab:
	[[ ! -s "$bkupFstab" ]] && \
	    echo "Backing up fstab: $bkupFstab" && \
	    sudo cp "$fstab" "$bkupFstab"
	echo "Adding mount to fstab: $cmd";
	echo -e "\n$cmd" | sudo tee -a "$fstab"
    fi
done

echo "Mounting all..." && sudo mount -a

echo "
Current mounts on $rootPoint:
"

df -h "$rootPoint/"*
