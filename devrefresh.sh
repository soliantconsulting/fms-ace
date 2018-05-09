#!/bin/bash

if [ "$1" = "--hard" ]; then
    docker pull php:7.2-apache
    docker pull node:8.1
fi

docker-compose run --rm build yarn install

# Refresh the local version config file using the template and `git describe`. This is the neat part!
if [ -f ./es6/config/version.local.js.dist ]
then
    # You must already have at least one tag set on the repo, or `git describe` will not work for this.
    version="$(git describe)"
    rm -f ./es6/config/version.local.js
    sed "s/'application_version'.*/'$version';/g" <es6/config/version.local.js.dist >es6/config/version.local.js
    printf "\nes6/config/version.local.js created with $version.\n"
else
    printf "\nERROR: es6/config/version.local.js.dist is missing. Cannot continue.\n"
    exit 1
fi
cp -n public/config/calendar.config.local.json.dist public/config/calendar.config.local.json

docker-compose run --rm build webpack --mode development
docker-compose exec web composer install
docker-compose up -d --build
docker-compose restart

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

echo 'Dev refresh complete and should now be running at http://localhost:8080'
