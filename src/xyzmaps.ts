#!/usr/bin/env node

/*
  Copyright (C) 2018 - 2021 HERE Europe B.V.
  SPDX-License-Identifier: MIT

  Permission is hereby granted, free of charge, to any person obtaining
  a copy of this software and associated documentation files (the
  'Software'), to deal in the Software without restriction, including
  without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so, subject to
  the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as common from "./common";

const program = require('commander');
const settings = require('user-settings').file('.xyzcli');
const latestVersion = require('latest-version');

const commands = ["space", "s", "transform","tf", "help"];

async function start() {
    process.removeAllListeners('warning');
    process.env.NODE_NO_WARNINGS = '1';
    await checkVersion();

    program
        .version(getVersion())
        .command('transform [csv2geo|shp2geo|gpx2geo]', 'convert from csv/shapefile/gpx to geojson').alias('tf')
        .command('space [list|create|upload]', 'work with Data Hub spaces').alias('xs')
    program.parse(process.argv);
    common.validate(commands, program.args, program);
}

start().catch(err => console.log(err));

function getVersion() {
    const pkg = require('../package.json');
    return pkg.version;
}

async function checkVersion() {
    const version = getVersion();
    const hrTime = process.hrtime();
    const ctime = hrTime[0] * 1000 + hrTime[1] / 1000000;
    const ltime = settings.get('lastAccessTime');
    const lastAccessVersion = getLastAccessVersion(ctime, ltime);
    if (lastAccessVersion && (version == lastAccessVersion)) {
        //version matched with cached version
        return;
    }

    const pv = await latestVersion('xyzmaps-cli');
    if (pv > version) {
        console.log("herecli('" + version + "') is out of date. Latest version is " + pv + ". Use command 'npm install -g xyzmaps-cli' to update to the latest version");
        process.exit(1);
    }
    // version matched with current version. We are up to date
    settings.set('lastAccessVersion', pv);
    settings.set('lastAccessTime', ctime);
}


function getLastAccessVersion(ctime: number, ltime: number | undefined) {
    const time = (ctime - (ltime ? ltime : 0)) / (1000 * 60);
    const lastAccessVersion = settings.get('lastAccessVersion');
    if (time > 15) {
        settings.set('lastAccessVersion', null);
        settings.set('lastAccessTime', null);
        return null;
    }
    return lastAccessVersion;
}
