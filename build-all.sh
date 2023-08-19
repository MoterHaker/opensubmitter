#!/bin/bash

function failedbuild {
  echo ""
  echo -e "\033[31mFAILED BUILD FOR $1\033[0m"
  exit 1
}

rm -rf ./release/*
mkdir -p ./release/ready
rm -rf ./templates/settings.json

DEBUG=electron-builder
VERSION=$(grep '"version"' package.json | awk -F'"' '{print $4}')

echo "building version $VERSION"

npm run buildmacarm || failedbuild "mac-arm"
mv ./release/opensubmitter_$VERSION.dmg ./release/ready/opensubmitter_mac_arm64.dmg

npm run buildmacx64 || failedbuild "mac-x64"
mv ./release/opensubmitter_$VERSION.dmg ./release/ready/opensubmitter_mac_amd64.dmg

npm run buildwinx64 || failedbuild "win64"
mv ./release/opensubmitter_$VERSION.exe ./release/ready/opensubmitter_windows_amd64.exe

npm run buildwinarm || failedbuild "win-arm"
mv ./release/opensubmitter_$VERSION.exe ./release/ready/opensubmitter_windows_arm64.exe

npm run buildlinuxamd64 || failedbuild "linux-amd64"
mv ./release/linux-unpacked ./release/opensubmitter_linux
cd ./release/ && zip -r opensubmitter_linux_amd64.zip opensubmitter_linux
mv ./opensubmitter_linux_amd64.zip ./ready/opensubmitter_linux_amd64.zip
cd .. && rm -rf ./release/opensubmitter_linux

