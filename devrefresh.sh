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
docker-compose run --rm build rm -rf built-files*
docker-compose run --rm build mkdir built-files
docker-compose run --rm build cp -rp ./public/dist ./built-files/dist
docker-compose run --rm build cp ./public/index.html ./built-files
docker-compose run --rm build zip -r built-files.zip built-files/*
docker-compose run --rm build rm -rf built-files/

# bring up the web server container
docker-compose up -d --build web

# run composer in the proxy web server container
docker-compose exec web composer install

read -r -d '' Heredoc_var <<'Heredoc_var'
\x1b[0m
  _______
 | A .   |
 |  /.\  |
 | (FMS) |
 |   |   |
 |_____V_|

 !FMS ACE!
\x1b[0m
Heredoc_var
echo -e "$Heredoc_var"

echo 'Dev refresh complete'
echo 'Make sure you have configured a FileMaker Server proxy in `public/fms-ace-config.json`'
echo 'Your local proxy server should now be accessible in a browser at http://localhost:8080'
