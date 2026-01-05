#!/bin/bash
NAME=paste-presets
DOMAIN=felixhuesken.de
UUID=$NAME@$DOMAIN

echo "---------------- $NAME-extension ----------------"

if $(gnome-extensions list | grep -q $UUID); then
    gnome-extensions uninstall $UUID
else
    echo "Extension $UUID not found"
    exit 1
fi

echo "------------------------------------------"
echo "$UUID extension is uninstalled"
echo "------------------------------------------"