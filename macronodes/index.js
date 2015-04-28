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
var manage = require('./manage.js');
var util = require('util');
var bodyparser = require('body-parser');
var express = require('express');
var serverConfig = require('./serverConfig.js');

//var macroNodes = [];
var settings;

function init(app, _settings) {
	settings = _settings;
	manage.getMacroNodes();
    serverConfig.init(app, _settings, this);
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

function setMacroNodes(nodes) {
	manage.setMacroNodes(nodes);
    //macroNodes = manage.getMacroNodes();
}

function addMacroNode(node) {
    return manage.addMacroNode(node);
}

function getMacroNodes() {
    return manage.macroNodes;
}

module.exports = {
	init:init,
	setMacroNodes: setMacroNodes,
    addMacroNode: addMacroNode,
    getMacroNodes: getMacroNodes,
    getFlows: manage.getFlows,
    loadMacroNodeTemplate: manage.loadTemplate,
    getMacroNodeTemplate: manage.getTemplate,
}