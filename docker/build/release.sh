#!/bin/bash

# bundle up the files needed for direct deployment on an FMS
rm -rf built-files*
mkdir built-files
rm -rf fms-ace*
mkdir fms-ace
cp -rp ./public/dist ./fms-ace/dist
cp ./public/index.html ./fms-ace
zip -r fms-ace.zip fms-ace/*
mv fms-ace.zip built-files
rm -rf fms-ace
