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

import { requestAsync } from "./requestAsync";
import {table,getBorderCharacters} from 'table';
import {ApiError} from "./api-error";
import * as turf from "@turf/turf";
import * as intersect from "@turf/intersect";
import * as zlib from "zlib";
import * as h3 from "h3-js";

const path = require('path');
const geojson2h3 = require('geojson2h3');
const h3resolutionRadiusMap = require('./h3resolutionRadiusMap.json');

export const questionConfirm = [
    {
        type: 'input',
        name: 'confirmed',
        message: 'Enter (Y)es to continue or (N)o to cancel'
    }
];

const settings = require('user-settings').file('.xyzcli');
const hubApi = settings.get("hubApi") || "http://localhost:8080/hub"
settings.set("hubApi",hubApi)

export function xyzRoot(){
    return hubApi;
}

export function isApiServerXyz(){
    return true;
}


async function getHostUrl(uri: string){
    return `${hubApi}/spaces/${uri}` 
}

export const keySeparator = "%%";

export let validated = false;
let rows = 100;
let cookie: string;

const tableConfig: any = {
    border: getBorderCharacters(`norc`),
    columnDefault: {
        wrapWord: true
    },
    drawHorizontalLine: (index: number, size: number) => {
        return index === 0 || index === 1 || index === rows || index === size;
    }
};

export function validate(commands: string[], args: string[], program: any) {
    if (!args || args.length === 0) {
        console.log("Invalid command 1 :");
        program.commandHelp();
    } else {
        if (args[0] == "help" || args[0] == "--help" || args[0] == "-h" || args[0] == "-help") {
            program.commandHelp();
        } else if (!commands.includes(args[0])) {
            console.log("Invalid command '" + args[0] + "'");
            program.commandHelp();
        }
    }
}

export function md5Sum(string: string) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(string).digest('hex');
}

export function timeStampToLocaleString(timeStamp: number) {
    const dt = new Date(timeStamp);
    return dt.toLocaleString(undefined, {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function createUniqueId(idStr: string, item: any) {
    const ids = idStr.split(",");
    const vals = new Array();
    ids.forEach(function (id) {
        const v = item.properties ? item.properties[id] : null;
        if (v) {
            vals.push(v);
        }
    });
    const idFinal = vals.join("-");
    return idFinal;
}

export function drawNewTable(data: any, columns: any, columnWidth?: any) {
    if(!columnWidth && columns && columns.length > 2) {
        let size = Math.floor(115 / columns.length);
        columnWidth = new Array(columns.length).fill(size);
    }
    if(columnWidth && columnWidth.length > 0 && columns && columns.length == columnWidth.length) {
        const obj:any = {};
        for(let i = 0; i < columnWidth.length; i++) {
            obj[i] = { width: columnWidth[i] }
        }
        tableConfig['columns'] = obj;
    }
    rows = data.length + 1 ; // +1 for header
    let output = table(extractTableData(columns, data),tableConfig);
    console.log(output);
}

export function drawTable(data: any, columns: any) {

    //console.table(extractData(columns, data));
    drawNewTable(data, columns);
}

function extractTableData(fields: any, data: any) {
    const rowArr = new Array();
    rowArr.push(fields);
    for(const r in data) {
        const colArr = new Array();
        for(const c in fields) {
            const fieldname = fields[c];
            //colArr.push(data[r][fieldname]);
            colArr.push(resolveObject(fieldname, data[r]));
        }
        rowArr.push(colArr);
    }
    return rowArr;
}

function extractData(fields: any, data: any) {
    const outArr = new Array();
    for (const i in data) {
        const obj: { [key: string]: any } = {};
        const cObj = data[i];
        for (const j in fields) {
            obj[fields[j]] = resolveObject(fields[j], cObj);
        }
        outArr.push(obj);
    }
    return outArr;
}

function resolveObject(path: any, obj: any) {
    return path.split('.').reduce(function (prev: any, curr: any) {
        return prev ? prev[curr] : undefined
    }, obj)
}

export function getSplittedKeys(inString: string) {
    if (inString.indexOf(keySeparator) != -1) {
        return inString.split(keySeparator);
    }

    //Backward support for old separator
    const tokens = inString.split("-");
    if (tokens.length === 2) {
        return tokens;
    } else {
        return null;
    }
}


export function getClippedh3HexbinsInsidePolygon(feature: any, h3resolution: string){
    //h3.polyfill
    const bufferedFeature = turf.buffer(feature, Number(h3resolutionRadiusMap[h3resolution]) * 2);
    const hexagons = geojson2h3.featureToH3Set(bufferedFeature, Number(h3resolution));
    let featureCollection =  geojson2h3.h3SetToFeatureCollection(hexagons);
    for (var i = featureCollection.features.length - 1; i >= 0; i--) {
        const newHexbin = intersect.default(feature, featureCollection.features[i]);
        if (newHexbin) { 
            newHexbin.id = featureCollection.features[i].id;
            featureCollection.features[i] = newHexbin;
        } else {
            featureCollection.features.splice(i, 1);
        }
    }
    return featureCollection;
}

export function getH3HexbinChildren(h3Index: string, resolution: number){
	let children = h3.h3ToChildren(h3Index,resolution)
	return children
}

/**
 *
 * @param apiError error object
 *@param isIdSpaceId set this boolean flag as true if you want to give space specific message in console for 404
*/
export function handleError(apiError: ApiError, isIdSpaceId: boolean = false) {
    if (apiError.statusCode) {
        if (apiError.statusCode == 401) {
            console.log("Operation FAILED : Unauthorized, if the problem persists, please reconfigure account with `here configure` command");
        } else if (apiError.statusCode == 403) {
            console.log("Operation FAILED : Insufficient rights to perform action");
        } else if (apiError.statusCode == 404) {
            if (isIdSpaceId) {
                console.log("Operation FAILED: Resource with given id does not exist");
            } else {
                console.log("Operation FAILED : Resource not found.");
            }
        } else {
            console.log("OPERATION FAILED : Error code - " + apiError.statusCode + ", message - " + apiError.message);
        }
    } else {
        if (apiError.message && apiError.message.indexOf("Insufficient rights.") != -1) {
            console.log("Operation FAILED - Insufficient rights to perform action");
        } else {
            console.log("OPERATION FAILED - " + apiError.message);
        }
    }
}

export async function execInternal(
    uri: string,
    method: string,
    contentType: string,
    data: any,
    token: string = "",
    gzip: boolean,
    setAuthorization: boolean,
    catalogHrn : string = ""
) {
    if (gzip) {
        return await execInternalGzip(
            uri,
            method,
            contentType,
            data,
            token,
            3,
            catalogHrn
        );
    }
    if (!uri.startsWith("http")) {
        uri = await getHostUrl(uri);
    }
    const responseType = contentType.indexOf('json') !== -1 ? 'json' : 'text';
    let headers: any = {
        "Content-Type": contentType,
    };
    // if(isApiServerXyz()){
    //     headers["Authorization"] = "Bearer " + token;
    // }
    const reqJson = {
        url: uri,
        method: method,
        headers: headers,
        json: method === "GET" ? undefined : data,
        allowGetBody: true,
        responseType: responseType
    };
    // console.log(reqJson)

    const response = await requestAsync(reqJson);
    if (response.statusCode < 200 || response.statusCode > 210) {
        let message = (response.body && response.body.constructor != String) ? JSON.stringify(response.body) : response.body;
        //throw new Error("Invalid response - " + message);
        throw new ApiError(response.statusCode, message);
    }
    return response;
}

function gzip(data: zlib.InputType): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) =>
        zlib.gzip(data, (error, result) => {
            if (error)
                reject(error)
            else
                resolve(result);
        })
    );
}

async function execInternalGzip(
    uri: string,
    method: string,
    contentType: string,
    data: any,
    token: string,
    retry: number = 3,
    catalogHrn : string
) {
    const zippedData = await gzip(data);
    if (!uri.startsWith("http")) {
        uri = await getHostUrl(uri);
    }
    let headers: any = {
        "Content-Type": contentType,
        "Content-Encoding": "gzip",
        "Accept-Encoding": "gzip"
    };
    // if(isApiServerXyz() || catalogHrn){
    //     headers["Authorization"] = "Bearer " + token;
    // }
    const responseType = contentType.indexOf('json') !== -1 ? 'json' : 'text';
    const reqJson = {
        url: uri,
        method: method,
        headers: headers,
        decompress: true,
        body: method === "GET" ? undefined : zippedData,
        allowGetBody: true,
        responseType: responseType
    };

    let response = await requestAsync(reqJson);
    if (response.statusCode < 200 || response.statusCode > 210) {
        if (response.statusCode >= 500 && retry > 0) {
            await new Promise(done => setTimeout(done, 1000));
            response = await execInternalGzip(uri, method, contentType, data, token, --retry, catalogHrn);
        } else if (response.statusCode == 413 && typeof data === "string"){
            let jsonData = JSON.parse(data);
            if(jsonData.type && jsonData.type === "FeatureCollection") {
                if(jsonData.features.length > 1){
                    console.log("\nuploading chunk size of " + jsonData.features.length + " features failed with 413 Request Entity too large error, trying upload again with smaller chunk of " + Math.ceil(jsonData.features.length / 2));
                    const half = Math.ceil(jsonData.features.length / 2);    
                    const firstHalf = jsonData.features.splice(0, half)
                    const firstHalfString = JSON.stringify({ type: "FeatureCollection", features: firstHalf }, (key, value) => {
                        if (typeof value === 'string') {
                            return value.replace(/\0/g, '');
                        }
                        return value;
                    });
                    response = await execInternalGzip(uri, method, contentType, firstHalfString, token, retry, catalogHrn);
                    const secondHalf = jsonData.features.splice(-half);
                    const secondHalfString = JSON.stringify({ type: "FeatureCollection", features: secondHalf }, (key, value) => {
                        if (typeof value === 'string') {
                            return value.replace(/\0/g, '');
                        }
                        return value;
                    });
                    const secondResponse = await execInternalGzip(uri, method, contentType, secondHalfString, token, retry, catalogHrn);
                    if(secondResponse.body.features) {
                        response.body.features = (response.body && response.body.features) ? response.body.features.concat(secondResponse.body.features) : secondResponse.body.features;
                    }
                    if(secondResponse.body.failed) {
                        response.body.failed = (response.body && response.body.failed) ? response.body.failed.concat(secondResponse.body.failed) : secondResponse.body.failed;
                    }
                } else {
                    console.log("\nfeature " + (jsonData.features[0].id ? ("with ID " + jsonData.features[0].id) : JSON.stringify(jsonData.features[0]) +" is too large for API gateway limit, please simplify the geometry to reduce its size"));
                    response = {
                        statusCode:200,
                        body:{
                            failed:jsonData.features
                        }
                    }
                }
            } else {
                throw new ApiError(response.statusCode, response.body);
            }
        } else {
            //   throw new Error("Invalid response :" + response.statusCode);
            throw new ApiError(response.statusCode, response.body);
        }
    }
    return response;
}

export async function execute(uri: string, method: string, contentType: string, data: any, token: string | null = null, gzip: boolean = false, setAuthorization: boolean = true, catalogHrn: string = "") {
    return await execInternal(uri, method, contentType, data, "", gzip, setAuthorization, "");
}

export function replaceOpearators(expr: string) {
    return expr.replace(">=", "=gte=").replace("<=", "=lte=").replace(">", "=gt=").replace("<", "=lt=").replace("+", "&");
}

export function createQuestionsList(object: any) {
    let tagChoiceList = createChoiceList(object);
    let IdTagquestions = [
        {
            type: "checkbox",
            name: "tagChoices",
            message: "Select attributes to be added as tags, like key@value",
            choices: tagChoiceList
        },
        {
            type: "checkbox",
            name: "idChoice",
            message:
                "Select attributes to be used as the GeoJSON Feature ID (must be unique)",
            choices: tagChoiceList
        }
    ];
    return IdTagquestions;
}

export function createChoiceList(object: any){
    let inputChoiceList: { name: string, value: string}[] = [];
    for (let i = 0; i < 3 && i < object.features.length; i++) {
        let j = 0;
        for (let key in object.features[0].properties) {
            if (i === 0) {
                const desc =
                    "" +
                    (1 + j++) +
                    " : " +
                    key +
                    " : " +
                    object.features[i].properties[key];
                    inputChoiceList.push({ name: desc, value: key });
            } else {
                inputChoiceList[j].name =
                inputChoiceList[j].name + " , " + object.features[i].properties[key];
                j++;
            }
        }
    }
    return inputChoiceList;
}

export function addDatetimeTag(dateValue:moment.Moment, element:string, options: any, finalTags: Array<string>){
    dateValue.locale('en');
    let allTags = false;
    if (options.datetag == true || options.datetag == undefined) {
        allTags = true;
    }
    let inputTagsList = [];
    if (!allTags) {
        inputTagsList = options.datetag.split(',');
    }
    if (allTags || inputTagsList.includes('year')) {
        addTagsToList(dateValue.year().toString(), 'date_' + element + '_year', finalTags);
    }
    if (allTags || inputTagsList.includes('month')) {
        addTagsToList(dateValue.format('MMMM'), 'date_' + element + '_month', finalTags);
    }
    if (allTags || inputTagsList.includes('year_month')) {
        addTagsToList(dateValue.year().toString() + '-' + ("0" + (dateValue.month() + 1)).slice(-2).toString(), 'date_' + element + '_year_month', finalTags);
    }
    if (allTags || inputTagsList.includes('week')) {
        addTagsToList(("0" + (dateValue.week())).slice(-2), 'date_' + element + '_week', finalTags);
    }
    if (allTags || inputTagsList.includes('year_week')) {
        addTagsToList(dateValue.year().toString() + '-' + ("0" + (dateValue.week())).slice(-2), 'date_' + element + '_year_week', finalTags);
    }
    if (allTags || inputTagsList.includes('weekday')) {
        addTagsToList(dateValue.format('dddd'), 'date_' + element + '_weekday', finalTags);
    }
    if (allTags || inputTagsList.includes('hour')) {
        addTagsToList(("0" + (dateValue.hour())).slice(-2), 'date_' + element + '_hour', finalTags);
    }
}

export function addTagsToList(value: string, tp: string, finalTags: string[]) {
    value = value.toString().toLowerCase();
    value = value.replace(/\s+/g, "_");
    value = value.replace(/,+/g, "_");
    value = value.replace(/&+/g, "_and_");
    value = value.replace(/\++/g, "_plus_");
    value = value.replace(/#+/g, "_num_");
    tp = tp.replace(/\s+/g, "_");
    //finalTags.push(value); // should we add tags with no @ an option?
    finalTags.push(tp + "@" + value);
    return finalTags;
}

export function uniqArray<T>(a: Array<T>) {
    return Array.from(new Set(a));
}

export function getFileName(fileName: string) {
    try {
        let bName = path.basename(fileName);
        if (bName.indexOf(".") != -1) {
            bName = bName.substring(0, bName.lastIndexOf("."));
        }
        return bName;
    } catch (e) {
        return null;
    }
}

export function addDatetimeProperty(dateValue:moment.Moment, element:string, options: any, item: any){
    dateValue.locale('en');
    let allTags = false;
    if (options.dateprops == true || options.dateprops == undefined) {
        allTags = true;
    }
    let inputTagsList = [];
    if (!allTags) {
        inputTagsList = options.dateprops.split(',');
    }
    if (allTags || inputTagsList.includes('year')) {
        item.properties['date_' + element + '_year'] = dateValue.year().toString();
    }
    if (allTags || inputTagsList.includes('month')) {
        item.properties['date_' + element + '_month'] = dateValue.format('MMMM');
    }
    if (allTags || inputTagsList.includes('year_month')) {
        item.properties['date_' + element + '_year_month'] = dateValue.year().toString() + '-' + ("0" + (dateValue.month() + 1)).slice(-2).toString();
    }
    if (allTags || inputTagsList.includes('week')) {
        item.properties['date_' + element + '_week'] = ("0" + (dateValue.week())).slice(-2);
    }
    if (allTags || inputTagsList.includes('year_week')) {
        item.properties['date_' + element + '_year_week'] = dateValue.year().toString() + '-' + ("0" + (dateValue.week())).slice(-2);
    }
    if (allTags || inputTagsList.includes('weekday')) {
        item.properties['date_' + element + '_weekday'] = dateValue.format('dddd');
    }
    if (allTags || inputTagsList.includes('hour')) {
        item.properties['date_' + element + '_hour'] = ("0" + (dateValue.hour())).slice(-2);
    }
}

export function collate(result: Array<any>) {
    return result.reduce((features: any, feature: any) => {
        if (feature.type === "Feature") {
            features.push(feature);
        } else if (feature.type === "FeatureCollection") {
            features = features.concat(feature.features);
        } else {
            console.log("Unknown type" + feature.type);
        }
        return features
    }, []);
}

export function getGeoSpaceProfiles(title: string, description: string, client: any, enableUUID: boolean = false) {
    return {
        title,
        description,
        client,
        enableUUID
    };
}

export function getSchemaProcessorProfile(schema: string) {
    return {
        "schema-validator" : [{
            "eventTypes": ["ModifyFeaturesEvent.request", "ModifySpaceEvent.request"],
            "params": {
                "schema": schema
            },
            "order": 0
        }]
    }
}
