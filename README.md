# FM'sCap (FileMaker Server Custom Admin Application)

## Development

To run the project in development, you need to have [Docker](https://www.docker.com/) and
[Docker Compose](https://docs.docker.com/compose/) installed.

### Dev Install

  - Install JavaScript components
    - `docker-compose run --rm build yarn install`
  - Build JavaScript components
    - `docker-compose run --rm build webpack`
  - Set up mount for SSH key in the PHP container (edit host path as needed)
    - `cp docker-compose.override.yml.dist docker-compose.override.yml`
  - Bring up the containers and install the PHP components
    - `docker-compose up -d`
    - `docker-compose exec php composer install`

You can now access the project via [http://localhost:8080](http://localhost:8080).

### Dev Refresh
  - Shorthand Development Environment Refresh
    - Runs a subset of above commands to quickly refresh dev after changes have been made.
      - `./devrefresh.sh`
    - To force all the Docker images to update, you can run it with the `--hard` switch
      - `./devrefresh.sh --hard`

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
