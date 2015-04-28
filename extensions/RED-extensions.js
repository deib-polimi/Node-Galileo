
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
var dgram = require('dgram');
//var cycle = require('./cycle.js');
var UDP = require('../udp_server');
var dashboard = require('../dashboard');
var devices = require('../devices');
//var querystring = require("querystring");

module.exports = {

	init: function(RED) {
		this.config_RED_comms(RED);
		this.config_nodes_udp_server(RED);
	},

	config_RED_comms: function(RED) {

		/*RED.comms.setNodesServer = function(udp) {
			this.nodesServer = udp;
		}*/

		RED.comms.setDevices = function(_devices) {
		    this.devices = _devices;
		}

		RED.comms.setMacroNodes = function(_macroNodes) {
			this.macroNodes = _macroNodes;
		}

		/**
		* Execute a node remotely
		* @param deviceID the id of the device
		* @param nodeID the id of the node
		* @param msg the message sent to the node
		* @return a promise for the starting of the node
		*/
		RED.comms.executeOnDevice = function(deviceID, nodeID, msg) {
		    var deviceList = this.devices.getAllDevices();
		    var deviceIP = null;
		    deviceList.forEach(function(item){
		        if(item['ID'] == deviceID)
		            deviceIP = item['deviceAddress'];
		    });
		    RED.comms.storeHttpStatus(msg);
		    if(deviceIP != null) {
		        var PORT = RED.settings.udpNodesPort;
		        var HOST = deviceIP;
		        var json = {
		            "node_message": msg,
		            "nodeID": nodeID
		        };
		        //var tmp = JSON.decycle(json);
				//console.log(json);
				var str = JSON.stringify(json);
				//str = querystring.escape(str);
				//console.log(str);
				var message = new Buffer(str);
		        var client = dgram.createSocket('udp4');
		        client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
		            if (err) throw err;
		            //util.log('[UDP] Message sent to ' + HOST +':'+ PORT);
		            client.close();
		        });
		    }
		}

		RED.comms.storeHttpStatus = function(message) {
			if(this.httpStatusStore === undefined)
				this.httpStatusStore = {};
			if(message.hasOwnProperty("res") && message.hasOwnProperty("req") && typeof message.res !== "string" && typeof message.req !== "string") {
				var resID = (1+Math.random()*4294967295).toString(16);
				var reqID = (1+Math.random()*4294967295).toString(16);
				this.httpStatusStore[reqID] = message.req;
				this.httpStatusStore[resID] = message.res;
				message.req = reqID;
				message.res = resID;
			}
		}

		RED.comms.getHttpStatus = function(message) {
			if(this.httpStatusStore === undefined)
				this.httpStatusStore = {};
			if(message.hasOwnProperty("res") && message.hasOwnProperty("req") && typeof message.res === "string" && typeof message.req === "string") {
				if(this.httpStatusStore.hasOwnProperty(message.req) && this.httpStatusStore.hasOwnProperty(message.res)) {
					message.req = this.httpStatusStore[message.req];
					message.res = this.httpStatusStore[message.res];
					delete this.httpStatusStore[message.res];
					delete this.httpStatusStore[message.req];
				}
			}
		}
	},

	config_nodes_udp_server: function(RED) {
		var udp = new UDP(RED, RED.settings.udpNodesPort);
		//udp.init(RED, RED.settings.udpNodesPort);
		udp.on_message(function(message, remote){
			//var tmp = querystring.unescape(message);
			var json = JSON.parse(message);
			//var json = JSON.retrocycle(tmp);
			RED.comms.getHttpStatus(json.node_message);
			//util.log("[UDP] nodes server received: " + json.node_message.payload + " destinationNode: " + json.nodeID);
	        var node = RED.nodes.getNode(json.nodeID);
	        if (node != null) {
	            try {
	                node.receive(json.node_message);
	            } catch(err) {
	                node.error("[UDP] nodes server exec got error: "+err);
	            }
	        } else {
	        	util.log("[UDP] nodes server error: node " + json.nodeID + " not found");
	        }
		});
		udp.on_error(function(err){
			util.log('[UDP] nodes server failed to start listening');
			//TODO write error in dashboard status
			dashboard.status[devices.getCurrentDevice().ID].status["nodes server"] = "down";
		});
		udp.on_listening(function(address){
			util.log('[UDP] nodes server listening on ' + address.address + ":" + address.port);
			//TODO write ok in dashboard status
			dashboard.status[devices.getCurrentDevice().ID].status["nodes server"] = "online";
		});
		RED.comms.nodesServer = udp;
	}
}