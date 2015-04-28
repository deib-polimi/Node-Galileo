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

var when = require('when');
var file_system = require('./file_system.js');
var util = require('util');
var bodyparser = require('body-parser');
var express = require('express');
var serverConfig = require('./serverConfig.js');

var allDevices = [];
var RED;
var is_server;
//var otherDevices = [];
var currentDevice = {};
var settings;

function init(_RED, _is_server) {
    RED = _RED;
	settings = RED.settings;
    file_system.init(_is_server, settings);
	allDevices = file_system.getDevices();
	currentDevice = file_system.currentDevice();
    is_server = _is_server;
    serverConfig.init(RED.httpAdmin, RED.settings, this);
    //RED.dashboard.updateDevices(allDevices);
}

/**
* Execute a node remotely
* @param deviceID the id of the device
* @param nodeID the id of the node
* @param msg the message sent to the node
* @return a promise for the starting of the node
*/
/*function executeOnDevice(deviceID, nodeID, msg) {

    var deviceList = allDevices;

    var deviceIP = null;
    deviceList.forEach(function(item){
        if(item['ID'] == deviceID)
            deviceIP = item['deviceAddress'];
    });
    if(deviceIP != null) {
        var PORT = settings.udpPort;
        var HOST = deviceIP;
        var dgram = require('dgram');
        var json = {
            "message": msg,
            "nodeID": nodeID
        };
        var message = new Buffer(JSON.stringify(json));
        var client = dgram.createSocket('udp4');
        client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
            if (err) throw err;
            util.log('[UDP] Message sent to ' + HOST +':'+ PORT);
            client.close();
        });
    }
}*/

/*function updateDevice(json) {
    var found = false;
    for(i in allDevices) {
        var device = allDevices[i];
        if(device.ID == json.ID) {
            device.deviceAddress = json.deviceAddress;
            device.name = json.name;
            found = true;
        }
    }
    if(!found) {
        otherDevices.push(device);
    }
}*/

function getServer() {
    var i;
    var result = {};
    for(i in allDevices){
        var device = allDevices[i];
        if(device['is_server'] == true)
            result = device;
    }
    return result;
}

function setDevices(devices) {
	file_system.setDevices(devices);
	allDevices = file_system.getDevices();
    var old_currentDevice = currentDevice;
	currentDevice = file_system.currentDevice();
    //RED.dashboard.updateDevices(allDevices);
    if(old_currentDevice.deviceAddress != currentDevice.deviceAddress)
        RED.comms.nodesServer.restart();
    RED.dashboard.restart();
}

function getAllDevices() {
    //var dev = otherDevices;
    //dev.push(currentDevice);
    //RED.dashboard.updateDevices(allDevices);
    return allDevices;
    //return dev;
}

function getCurrentDevice() {
    return currentDevice;
}

module.exports = {
	init:init,
	setDevices: setDevices,
    getCurrentDevice: getCurrentDevice,
    getAllDevices: getAllDevices,
    getServer: getServer
    //executeOnDevice: executeOnDevice
    //updateDevice: updateDevice
}