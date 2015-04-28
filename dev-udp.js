
/**
 * Copyright 2014 Paolo Ferraris
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

var util = require('util');
var os = require('os');
var dgram = require('dgram');


var schedule;
var RED;
var settings;
var socketList;

var getAddresses = function() {
	var interfaces = os.networkInterfaces();
	var addresses = [];
	for (var k in interfaces) {
	    for (var k2 in interfaces[k]) {
	        var address = interfaces[k][k2];
	        if (address.family === 'IPv4' && !address.internal) {
	            addresses.push(address.address);
	        }
	    }
	}
	return addresses;
}

var startListening = function(address) {
	var PORT = 33555;
	var HOST = address;

	var socket = dgram.createSocket('udp4');

	socket.on('listening', function () {
		socket.setBroadcast(true);
	    var address = socket.address();
	    util.log('[UDP] Devices Server listening on ' + address.address + ":" + address.port);
	});

	socket.on('error', function(err) {
		util.log("[UDP] server error:\n" + err.stack);
  		server.close();
	});

	socket.on('message', function (message, remote) {
		util.log("[UDP SERVER] received ping from: " + remote.address);
		var json = JSON.parse(message);
		json.deviceAddress = remote.address;
		RED.devices.updateDevice(json);
        /*var node = RED.nodes.getNode(json.nodeID);
        if (node != null) {
            try {
                node.receive(json.message);
                //node.log('exec ok');
            } catch(err) {
                //res.status(500);
                node.error("[UDP SERVER] exec failed:"+err);
                //console.log(err.stack);
            }
        } else {
        	util.log("[UDP SERVER] node " + json.nodeID + " not found");
        }*/
	});

	socket.bind(PORT, HOST);
	socketList.push(socket);
}

var stop = function() {
	clearInterval(schedule);
	for(i in socketList) {
		var socket = socketList[i];
		socket.close();
	}
	socketList = Array();
}

var start = function() {
	socketList = Array();
	var addresses = getAddresses();
	for(i in addresses) {
		var address = addresses[i];
		startListening(address);
	}
}

var broadcastPing = function() {
	/*for(i in socketList) {
		var socket = socketList[i];
		var address = socket.address();
		util.log(address.address);
		var tmp = address.address.split('.');
		var broadcastAddress = tmp[0] + '.' + tmp[1] + '.' + tmp[2] + '.255';
		var json = {
            "deviceName": settings.deviceName,
            "deviceID": RED.comms.devices.getCurrentDevice().ID
        };
        var message = new Buffer(JSON.stringify(json));
		socket.send(message, 0, message.length, address.port, broadcastAddress, function(err, bytes) {
            if (err) throw err;
            util.log('[UDP] Ping sent to ' + broadcastAddress +':'+ address.port);
        });
	}*/
	var PORT = 33555;
    var json = {
        "deviceName": settings.deviceName,
        "deviceID": RED.comms.devices.getCurrentDevice().ID
    };
    var message = new Buffer(JSON.stringify(json));
    var client = dgram.createSocket('udp4');
    client.bind(PORT, function() {
    	client.setBroadcast(true);
    	var i;
	    for(i=0;i<socketList.length;i++) {
			var socket = socketList[i];
			var address = socket.address();
			util.log(address.address);
			var tmp = address.address.split('.');
			var j;
			for(j=0;j<255;j++) {
				if(j !== parseInt(tmp[3])) {
					var broadcastAddress = tmp[0] + '.' + tmp[1] + '.' + tmp[2] + '.' + j;
					util.log(broadcastAddress);
					var json = {
			            "name": settings.deviceName,
			            "ID": RED.comms.devices.getCurrentDevice().ID
			        };
			        var message = new Buffer(JSON.stringify(json));
					client.send(message, 0, message.length, address.port, broadcastAddress, function(err, bytes) {
			            if (err) throw err;
			            //util.log('[UDP] Ping sent to ' + broadcastAddress +':'+ address.port);
			        });
				}
			}
		}
    });
}

var server = {

	init: function(_settings, _red) {

		RED = _red;
		settings = _settings;
		start();
		broadcastPing();
		setInterval(broadcastPing, 10000);
	}
	
}

module.exports = server