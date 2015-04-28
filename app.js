
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

var devices = require("./devices");
var RED_extensions = require('./extensions/RED-extensions.js');
var macroNodes = require('./macronodes');
//var old_dashboard = require('./dashboard_udp');
var dashboard = require('./dashboard');

var is_server = false;

var RED;

var APP = {

	init: function(_RED, server, app, settings) {
		console.log('');
		if(settings.hasOwnProperty('disableEditor'))
			is_server = !settings['disableEditor'];
		else
			is_server = true;
		RED = _RED;
		// Initialize the runtime with a server and settings
		RED.init(server,settings);
		RED_extensions.init(RED);
		devices.init(RED, is_server);
		//old_dashboard.init(RED, server);
		dashboard.init(server, app, settings, is_server, RED.nodes);
		RED.dashboard = dashboard;
		RED.comms.setDevices(devices);
		macroNodes.init(RED.httpAdmin, RED.settings);
		RED.comms.setMacroNodes(macroNodes);
		//UDP.init(settings, RED);
    	//RED.comms.setNodesServer(UDP);
    	//if(is_server)
    		//UI.init(RED, app);
    	//console.log(RED.comms.nodesServer);
	}, 

	start: function() {
		/*UDP.start()
		.then(function() {
			//console.log("ok");
		})
		.otherwise(function() {
			//console.log("failed");
		});*/
		RED.comms.nodesServer.start();
		dashboard.start();
	}
};

module.exports = APP;