# XYZ CLI

XYZ Maps CLI is a Node.js command-line interface to work with XYZ APIs starting with [XYZ Hub](https://github.com/xyzmaps/xyz-cli) APIs. It allows you to interact with XYZ Hub to create and manage your Spaces, and easily upload and manage your datasets.

XYZ Maps CLI has been forked from the proprietary (but open source) HERE CLI with all HERE specific authentication, telemetry, services and APIs removed. It works directly with the stand-alone, unauthenticated version XYZ Hub APIs. The commands and sub-commands have been renamed to make more sense in the context of the Open Source version of XYZ Maps. It is intended to work with `localhost:8080/hub` APIs right now and not very configurable. Consider it as a stop gap for basic functionality until version 2.0 becomes available.

### Prerequisites

XYZ CLI is built on Node.js, a cross-platform efficient language to write even complex, local applications.

To use the  XYZ CLI, you should have npm installed. The best way is to go to nodejs.org and install the appropriate package for your system (both 8.x LTS and 10.x Current should work). 

### Installing the CLI

To install the XYZ CLI use the following command. Depending on your system, you might need elevated permissions (like sudo) to install globally.

```
npm install -g xyzmaps-cli
```

If all goes well, you can check if the CLI is installed correctly by just runnning

```
xyzmaps --help
```


## Configure XYZ CLI

As the XYZ CLI works with XYZ APIs hosted locally, so there is no need to configure and API keys or developer identity.

## Supported Commands

The CLI currently enables the following sub-commands:

```
  space|xs [list|create|upload]           work with Data Hub spaces
  transform|tf [csv2geo|shp2geo|gpx2geo]  convert from csv/shapefile/gpx to geojson
  help [command]                          display help for command
```

## Development

### Building the CLI

To develop the CLI further and add new features, first clone this repository and install the 
npm dependencies.

```
git clone https://github.com/heremaps/here-cli.git
npm install
```

Normally as a user you would install the CLI with a `-g` switch globally so that it can be
used outside of a package directory. To make development easier it makes more sense not to
that globally as that requires elevated permissions.

You should test and debug the commands by running the respective .js file. We use 
[npm commander](https://www.npmjs.com/package/commander) to drive the command parsing and
execution. To get a good 
understanding how it *feels* on the commandline use local linking to make the `bin` sources
available as executable commands:

```
npm link
```

Finally to package and distribute a new release (which we would do, not you) we update and
tag the version followed by

```
npm pack ...
npm deploy ...
```

### Contributing

We encourage contributions. Please read the notes in [CONTRIBUTING.md](CONTRIBUTING.md).

When you add a new sub-command (as `bin/here-commandname.js`) please make sure to also include the relevant documentation (as `docs/commandname.md`).

## License

Copyright (C) 2023 - 2023 XYZ Maps and contributors

Copyright (C) 2018 - 2021 HERE Europe B.V.

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details


