#!/bin/bash
NAME=paste-presets
DOMAIN=felixhuesken.de
UUID=$NAME@$DOMAIN
ZIP_NAME=$UUID.zip

echo "---------------- $NAME-extension ----------------"

echo "Creating zip file..."
zip -qr $ZIP_NAME ./* && echo "zip file created"

echo "Installing extension from zip file ..."

gnome-extensions install -f $ZIP_NAME
rm -rf $ZIP_NAME

echo "------------------------------------------"
echo "$UUID extension installed"
echo "------------------------------------------"