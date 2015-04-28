/**
 * Copyright 2013 Paolo Ferraris
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

var http = require('http');
var express = require("express");
var RED = require("./node-red");
var APP = require('./app.js');
var Galileo = require('./galileo-io');
var util = require('util');
var dashboard = require('./dashboard');

// Create an Express app
var app = express();

// Create a server
var server = http.createServer(app);

// Create the settings object - see default settings.js file for other options
var settings = require('./settings.js');

//initialize app variables
APP.init(RED, server, app, settings);

RED.galileo = new Galileo();
RED.galileo.ready = false;

RED.galileo.on('ready', function() {
    util.log('[GALILEO] Board ready');
    RED.galileo.ready = true;

	// Serve the editor UI from /red
	app.use(settings.httpAdminRoot,RED.httpAdmin);

	// Serve the http nodes UI from /api
	app.use(settings.httpNodeRoot,RED.httpNode);

	server.listen(settings.uiPort);

	// Start the runtime
	dashboard.notifyStatus("flows engine", "starting");
	APP.start();
	RED.start()
	.then(function() {
		dashboard.notifyStatus("flows engine", "online");	
	})
	.otherwise(function(){
		dashboard.notifyStatus("flows engine", "down");
	});
});