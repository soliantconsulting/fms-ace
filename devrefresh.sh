#!/bin/bash

# refresh the base docker images if requested
if [ "$1" = "--hard" ]; then
    docker pull php:7.2-apache
    docker pull node:8.1
fi

# refresh the version config with the build container
docker-compose run --rm build cat es6/config/version.local.js.dist | sed s/application_version/$(git describe)/g > es6/config/version.local.js

# deploy the default proxy config (no clobber) with the build container
docker-compose run --rm build cp -n public/fms-ace-config.json.dist public/fms-ace-config.json

# run yarn and webpack in development mode with the build container
docker-compose run --rm build yarn install
docker-compose run --rm build webpack --mode development

# refresh built-files.zip with the build container
docker-compose run --rm build docker/build/release.sh

# bring up the web server container
docker-compose up -d --build web

# run composer in the proxy web server container
docker-compose exec web composer install

read -r -d '' Heredoc_message <<'Heredoc_message'
\x1b[0m
!!!! !FMS ACE! !!!!
!!    _______    !!
!!   | A .   |   !!
!!   |  /.\  |   !!
!!   | (FMS) |   !!
!!   |   |   |   !!
!!   |_____V_|   !!
!!               !!
!!!! !FMS ACE! !!!!

Refresh complete
Your local proxy server should now be accessible in a browser at http://localhost:8080
Heredoc_message

echo -e "$Heredoc_message"

if [ ! -f public/fms-ace-config.json ]; then
echo ''
echo '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! IMPORTANT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
echo '!! You must configure the proxy for your FileMaker Server before FMS ACE will work. !!'
echo '!!        Copy `public/fms-ace-config.json` as `public/fms-ace-config.json`.        !!'
echo '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! IMPORTANT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
fi

if [ "$(docker-compose run --rm build diff public/fms-ace-config.json public/fms-ace-config.json.dist)" = "" ]; then
echo ''
echo '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! IMPORTANT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
echo '!! You must configure the proxy for your FileMaker Server before FMS ACE will work. !!'
echo '!!        Open `public/fms-ace-config.json` and update the `host` value.            !!'
echo '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! IMPORTANT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
fi
echo ''
