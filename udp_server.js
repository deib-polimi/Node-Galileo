
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
//var when = require('when');

//var server;
var RED;
//var PORT;
//var listening_callback;
//var error_callback;
//var message_callback;

function udp(_RED, _port) {
	RED = _RED;
    this.PORT = _port;
}

udp.prototype.stop = function() {
	try {
		this.server.close();
	} catch(e) {}
}

udp.prototype.on_listening = function(callback) {
    this.listening_callback = callback;
}

udp.prototype.on_error = function(callback) {
	this.error_callback = callback;
}

udp.prototype.on_message = function(callback) {
	this.message_callback = callback;
}

udp.prototype.restart = function() {
	this.stop();
	this.start();
}

udp.prototype.start = function() {
	var HOST = RED.comms.devices.getCurrentDevice().deviceAddress;
	//var defer = when.defer();

	this.server = dgram.createSocket('udp4');
	var server = this.server;
	var listening_callback = this.listening_callback;
	var message_callback = this.message_callback;
	var error_callback = this.error_callback;
	this.server.on('listening', function () {
		var address = server.address();
	    listening_callback(address);
	    //defer.resolve();
	});

	this.server.on('error', function(err) {
	    error_callback(err);
  		server.close();
  		//defer.reject();
	});

	this.server.on('message', function (message, remote) {
		message_callback(message, remote);
	});

	this.server.bind(this.PORT, HOST);
	//return defer.promise;
}

module.exports = udp;

