# FMS ACE (FileMaker Server Admin Console Extension)

Pronounced as F.M.S. Ace

## Development

To run the project in development, you need to have [Docker](https://www.docker.com/) and
[Docker Compose](https://docs.docker.com/compose/) installed.

### Development Quick Start (See devrefresh for more info)
  - Shorthand Development Environment Refresh
    - Runs a subset of above commands to quickly refresh dev after changes have been made.
      - `./devrefresh.sh`
    - To force all the Docker images to update, you can run it with the `--hard` switch
      - `./devrefresh.sh --hard`

You can now access the project via [http://localhost:8080](http://localhost:8080).
# Docker Development Environment

This application is running apache2/php7.2 built with Docker and stored in git. Php package
dependencies are managed with composer in package.json. Javascript and CSS package dependencies are managed with npm in
composer.json. 

## Making continuous changes in the /es6 directory

While working on the front-end, you may have to call webpack multiple times. Instead you can run the following command,
which while watch the directory for changes and rebuild when required:

```
docker-compose run --rm build webpack --mode development --watch
```
