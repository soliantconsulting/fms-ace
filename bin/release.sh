#!/bin/bash

# refresh the version config with the build container
docker-compose run --rm build cat es6/config/version.local.js.dist | sed s/application_version/$(git describe)/g > es6/config/version.local.js

# clear out the dist directory
rm public/dist/*

# run yarn and webpack in development mode with the build container
docker-compose run --rm build yarn install
docker-compose run --rm build webpack --mode production

# zip it all up
docker-compose run --rm build docker/build/zip-release.sh
