#!/bin/bash
mkdir -p ./release
rm -rf ./release/*

npx electron-packager ./ --out=release/macos-arm64 --platform=mas --arch=arm64 --icon=./src/assets/opensubmitter.icns
mv release/macos-arm64/opensubmitter-mas-arm64/* release/macos-arm64/
rm -rf release/macos-arm64/opensubmitter-mas-arm64

npx electron-packager ./ --out=release/macos-x64 --platform=mas --arch=x64 --icon=./src/assets/opensubmitter.icns
mv release/macos-x64/opensubmitter-mas-x64/* release/macos-x64/
rm -rf release/macos-x64/opensubmitter-mas-x64

npx electron-packager ./ --out=release/windows --platform=win32 --arch=x64 --icon=./src/assets/opensubmitter.ico
mv release/windows/opensubmitter-win32-x64/* release/windows_x64/
rm -rf release/windows/opensubmitter-win32-x64

npx electron-packager ./ --out=release/windows --platform=win32 --arch=arm64 --icon=./src/assets/opensubmitter.ico
mv release/windows/opensubmitter-win32-arm64/* release/windows_arm64/
rm -rf release/windows/opensubmitter-win32-arm64

npx electron-packager ./ --out=release/linux --platform=linux --arch=x64 --icon=./src/assets/logo.png
mv release/linux/opensubmitter-linux-x64/* release/linux/
rm -rf release/linux/opensubmitter-linux-x64
