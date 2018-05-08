# Contributing

We welcome pull requests from everyone! Here are some basic tips and tricks for constructive contribution.

## Background

There are a few setup steps we recommend to create the same kind of local development environment that we use. You'll need to fork the project on Github, and then clone it in your local environment. You'll also need to set up a local web server.

You may ask yourself, "Wait a minute! Why do I need to set up a web server to develop a JavaScript app?!" It's a great question.

While this is a JavaScript application, and FileMaker Server (FMS) is going to be providing all the data and persistence we need for this app, we want to be able to work on the JavaScript portion locally with FMS running anywhere convenient. The fact that we need to make XHR command requests to FileMaker Server presents us with a security concern called Cross-Origin Resource Sharing (CORS). Browser vendors disallow CORS by default. A web server technically *can* return a header which lets XHR requests be made from different domains, but CORS is disallowed by FMS, as it should be. We do not advise modifying FMS to allow CORS. See this [Wikipedia article for more details about CORS][cors].

The long and the short of it is we want to develop and test our JavaScript app in a browser on one domain, such as `localhost` with a remote FMS, such as `myserver.soliant.cloud`, and the correct way to handle this is to proxy FMS so that we can make our XHR requests to the same local server we're testing from.

[cors]: https://en.wikipedia.org/wiki/Cross-origin_resource_sharing

## Fork and Clone

You'll need to have a GitHub account, and we assume you've already [set up an SSH key][ssh], as this is the most convenient and secure way to work with GitHub.

[ssh]: https://help.github.com/articles/connecting-to-github-with-ssh/

Fork, then clone the repo:

```
git clone git@github.com:your-username/fms-ace.git
```

You will need to check out master, and create a feature branch to make your changes on. When you have your changes ready, you will push them up to your fork on GitHub, and then open a pull request (aka PR). This will prompt one of us to review your proposed changes, and either give you feedback, or pull your request into master. Details on how to work with Git are beyond the scope of this contributing guideline.

## Install Docker

As mentioned in the intro, developing locally requires a proxy for your FileMaker Server.

We provide a simple development proxy via Docker. We also provide a separate Docker container which is configured to manage the build process.

So, before you move on to next steps you need to have [Docker](https://www.docker.com/) (the Community edition of Docker suffices) and
[Docker Compose](https://docs.docker.com/compose/) installed.

After you install Docker, launch it and accept the app's request for access privileges to your machine.

Verify that Docker is properly installed by running the command:

```
docker version
```

## Configure Development Proxy

To configure the proxy, duplicate the `public/fms-ace-config.json.dist` file and name the duplicate `public/fms-ace-config.json`. Then set the host value in the new file to the domain name of your FileMaker Server, e.g.:

```
{
    "useProxy": true,
    "sslVerify": true,
    "fmsHosts": [
        {
            "host": "example.soliant.cloud",
            "scheme": "https",
            "port": "443"
        },
        {
            "host": "localhost",
            "scheme": "https",
            "port": "443"
        }
    ]
}

```

That's the only configuration needed.

## Quick Start

To keep it fast and simple to manage the proxy server, we've provided a shell script you can run which will start and/or reset everything for you. It has two modes: normal and hard. The hard switch forces the base Docker images to get rebuilt, and normally shouldn't be needed. In your Terminal app, cd to the project root, and run it like this:

```
./bin/devrefresh.sh

# optional run with hard switch to refresh Docker images
./bin/devrefresh.sh --hard
```

If everything worked properly, you can now access the project via [http://127.0.0.1:8080](http://127.0.0.1:8080). Note: FileMaker Server 17 configures itself on the default ports of your local web server. If you have installed FMS on your local system, it's possible that you'll get a rewrite behavior from http to https when you specify localhost in your url. Since localhost can get rewritten by your FMS-configured local web server to https, we recommend using the loopback IP address instead to avoid this behavior: [http://127.0.0.1:8080](http://127.0.0.1:8080).

For more advanced usage, start by looking at the `bin/devrefresh.sh` file itself for examples of common commands.

## Docker Containers

### Web Server and FMS Proxy

See for details on the Web server:

* `docker-compose.yml`
* `docker/web/`

See for details on the CORS Proxy:

* `composer.json`

### Build Container

It is our strongly held belief that using developer-friendly, well documented process is key to a successful project. We believe it should not require highly specialized development skills to make a new team member productive. This project provides a build server which completely encapsulates the build process, making it very simple to spin up a dev environment. As soon as you have Docker installed, all you need to run the build process is a simple docker-compose prefix to access a uniform, powerful, local build environment:

```
docker-compose run --rm build
```

This tells docker-compose to run the container we've named 'build' and immediately remove the container after run. We just want it to execute something immediate, so we don't want it to stick around. Anything you write after 'build', will be executed in the container's context before it exits. Any results returned in the container are returned to you. This means that you do not have to worry about numerous environment dependencies, such as node, npm, yarn, webpack, etc.

Setting up and managing a build pipeline used to be a brittle and frustrating process, creating an initial steep ramp for working with build automation. With a pre-configured build container, the process is simple. You can do anything you'd normally do with webpack, but without having to setup and maintain any of the lower level dependencies in your environment. For example, this is a webpack command:

```
webpack --mode development
```

To run this in the 'build' container, you combine it with the prior prefix like this:

```
docker-compose run --rm build webpack --mode development
```

Piece of cake! For more examples of commands run with the build container take a look inside `bin/devrefresh.sh`

## JavaScript Development

This project is built using [ES6/TypeScript][typescript] and [Webpack][webpack]. TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. Webpack is a static module bundler for modern JavaScript applications. When webpack processes your application, it internally builds a dependency graph which maps every module your project needs and generates one or more bundles. This may take a little bit of adjustment if you're used to working directly with JavaScript, but you will quickly come to appreciate how much simpler it is to manage scope and dependencies.

[typescript]: https://www.typescriptlang.org/
[webpack]: https://webpack.js.org/

### Source Code

There are only two places in the project you need to look for source code and dependencies:

* `es6/`
* `webpack.config.js`

The TypeScript source code, including assets, CSS, and HTML templates, is located in the `es6` directory. This is where all development happens. Once the development environment is initially configured, you shouldn't have to touch anything outside of the `es6` directory unless you need to add a dependency to `webpack.config.js`.

You will always need to build the project before you can see your changes in a browser. You can do this manually for occasional changes, or if you're doing active development, Webpack can watch your sources for you, and automatically build whenever anything changes.

Manual build:
```
docker-compose run --rm build webpack --mode development
```

Automatic build:
```
docker-compose run --rm build webpack --mode development --watch
```

### Release Builds

Every time you run `./bin/devrefresh.sh`, it will build a development version of the project in `public/dist`. To build a compacted and optimized version, you need to run webpack in production mode. Then you can extract just the files needed to deploy directly on a FileMaker Server by running the `bin/release.sh` script we've provided. This will update the `built-files/fms-ace.zip` archive. See the main [README.md] for details on deploying these files.

```
./bin/release.sh
```

## Create A Pull Request

If you've made a change which you'd like to contribute back to the community, you'll need to make a pull request. Here's what we need.

Push your new branch to your fork and [submit a pull request][pr].

[pr]: https://github.com/soliantconsulting/fms-ace/compare/

At this point you're waiting on us. We try to at least comment on pull requests within three business days (and, typically, one business day). If you don't get any response within three days, feel free to bump it with a comment. We may suggest some changes or improvements or alternatives.

## Tips

Some things that will increase the chance that your pull request is accepted:

* Write [good commit messages][commit].
* Explain and/or justify the reason for the change in your PR description.

[commit]: https://git-scm.com/book/ch5-2.html#Commit-Guidelines
