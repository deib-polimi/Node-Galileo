/**
 * Copyright 2013, 2014 Paolo Ferraris
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var fs = require('fs');
var util = require('util');

var allDevices = [];
var directory = __dirname+'/list';
var is_server;
var settings;

function init(_is_server, _settings) {
    if(!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }
    settings = _settings;
    is_server = _is_server;
}

function setDevices(devicesJson) {
    var others = Array();
    var current = currentDevice();
    devicesJson.forEach(function(device) {
        if(device.ID === undefined) {

        }
        else if(device.ID == current.ID) {
            setCurrentDevice(device);
        }
        else {
            others.push(device);
        }
    });
    setOthersDevices(others);
}

function getDevices() {
    var json = [];
    try {
        var str = fs.readFileSync(directory+'/other_devices.json', 'utf8');
        json = JSON.parse(str);
        //util.log('[DEVICES] other devices loaded');
    }
    catch(error) {
        var json = [];
        saveToFile(JSON.stringify(json, null, 4), directory+'/other_devices.json');
        util.log('[DEVICES] other devices initialized');
        //json = loadDevices();
    }
    json.push(currentDevice());
        util.log('[DEVICES] devices loaded');
    return json;
}

function currentDevice() {
    var json = {};
    try {
        var str = fs.readFileSync(directory+'/current_device.json','utf8');
        json = JSON.parse(String(str));
        if(json.is_server != is_server) {
            json.is_server = is_server;
            saveToFile(JSON.stringify(json, null, 4), directory+'/current_device.json')
        }
        //console.log(JSON.stringify(json));
    }
    catch(error) {
        //json = loadCurrentDevice();
        var json = {
            "name": "local",
            "ID": (1+Math.random()*4294967295).toString(16),
            "deviceAddress": settings.deviceAddress,
            "is_server": is_server
        };
        saveToFile(JSON.stringify(json, null, 4), directory+'/current_device.json')
        util.log('[DEVICES] current device initialized');
    }
    return json;
}


function saveToFile(str, fileName) {
    //util.log(fileName);
    fs.writeFileSync(fileName, str);
}

/*function loadDevices() {
    if(!fs.existsSync(directory+'/other_devices.json')) {
        var json = [];
        saveToFile(JSON.stringify(json, null, 4), directory+'/other_devices.json');
        util.log('current device initialized');
        return json;
    }
    return require('./other_devices.json');
}

function loadCurrentDevice(is_server) {
    if(!fs.existsSync(directory+'/current_device.json')) {
        var device = {
            "name": "local",
            "ID": (1+Math.random()*4294967295).toString(16),
            "deviceAddress": null,
            "is_server": is_server
        };
        saveToFile(JSON.stringify(device, null, 4), directory+'/current_device.json')
        return device;
    }
}*/

function setOthersDevices(json) {
    if(json !== undefined) {
        saveToFile(JSON.stringify(json, null, 4), directory+'/other_devices.json');
    }
}

function setCurrentDevice(json) {
    if(json === undefined) {
        if(!fs.existsSync(directory+'/current_device.json')) {
            var device = {
                "name": "local",
                "ID": (1+Math.random()*4294967295).toString(16),
                "deviceAddress": null
            };
            saveToFile(JSON.stringify(device, null, 4), directory+'/current_device.json')
            return device;
        }
        return require('./current_device.json');
    }
    else {
        saveToFile(JSON.stringify(json, null, 4), directory+'/current_device.json')
        return json;
    }
    /*if(!fs.existsSync('./current_device.json')) {
        var devices = {
            "name": "local",
            "ID": (1+Math.random()*4294967295).toString(16),
            "deviceAddress": null
        };
        saveToFile(JSON.stringify(devices, null, 4), './current_device.json')
        //fs.writeFileSync('./current_device.json', JSON.stringify(devices, null, 4));
    }*/
}

module.exports = {
    init:init,
    setDevices: setDevices,
    //loadDevices: loadDevices,
    //loadCurrentDevice: loadCurrentDevice,
    setCurrentDevice: setCurrentDevice,
    getDevices: getDevices,
    currentDevice: currentDevice,

    getDevice: function(ID) {
        var devices = getDevices();
        var tmp = devices.filter(function(x){return x['ID'] == ID});
        if(tmp.length == 1)
            return tmp[0];
        else
            return null;
    }
}

module.exports.__defineGetter__("allDevices", function() { return allDevices });