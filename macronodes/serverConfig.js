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
var bodyparser = require('body-parser');
var util = require('util');

var settings;

var serverConfig = {

	init: function(app, _settings, _nodes) {

		settings = _settings;

      app.post("/setMacroNodes",
          bodyparser.json(),
          function(req,res) {
              util.log("[MACRO NODES] Nodes list received");
              var nodes = req.body;
              _nodes.setMacroNodes(nodes)
              .then(function() {
                res.status(204).end();
              })
              .otherwise(function() {
                res.status(400).send("error");
              })
              
          },
          function(error,req,res,next) {
            util.log(error.message);
              res.status(400).send("Invalid Macro Nodes list");
          }
      );

	    app.post("/macroNode",
	        bodyparser.json(),
	        function(req,res) {
	            util.log("[MACRO NODES] Macro Node received");
	            var node = req.body;
	            _nodes.addMacroNode(node)
              .then(function() {
                res.status(204).end();
              })
              .otherwise(function() {
                res.status(400).send("Invalid Macro Node");
              });
	        },
	        function(error,req,res,next) {
	        	util.log(error.message);
	            res.status(400).send("Invalid Macro Node");
	        }
	    );

	    app.get("/macroNodes", function(req,res) {
	        //util.log("[MACRO NODES] total macro nodes: " + _nodes.getMacroNodes().length);
	        res.json(_nodes.getMacroNodes());
	    });

	}
}

/**
* Send device list remotely
* @param deviceAddress the address of the device
* @param devices the device list
* @return a promise for the sending of the list
*/
/*function sendDevices(deviceAddress, devices) {
    var httpClient = require('http');
    var defer = when.defer();
    util.log('[DEVICE MANAGER] send devices to: '+deviceAddress);
    if(deviceAddress != null && devices != null) {

        var postData = JSON.stringify(devices);
        var options = {
          hostname: deviceAddress,
          port: settings.uiPort,
          path: '/admin/devices',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
          }
        };

        var req = httpClient.request(options, function(res) {
            //console.log('STATUS: ' + res.statusCode);
            if(res.statusCode == 204)
                defer.resolve();
            else
                defer.reject("");
        });

        req.on('error', function(e) {
          util.log('[DEVICE MANAGER] problem with request: ' + e.message);
          util.log('[DEVICE MANAGER] unable to update device list on ' + deviceAddress);
          defer.reject(e);
        });
        req.write(postData);
        req.end();
    }
    else
        defer.reject("");
    return defer.promise;
}*/

/**
* Send a flow remotely
* @param deviceAddress the address of the device
* @param flow the flow
* @return a promise for the sending of the flow
*/
/*function sendFlow(deviceAddress, flow) {
    var httpClient = require('http');
    var defer = when.defer();
    if(deviceAddress != null && flow != null) {

        var postData = JSON.stringify(flow);
        var options = {
          hostname: deviceAddress,
          port: settings.uiPort,
          path: '/admin/flows',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
          }
        };

        var req = httpClient.request(options, function(res) {
            //console.log('STATUS: ' + res.statusCode);
            if(res.statusCode == 204)
                defer.resolve();
            else
                defer.reject("");
        });

        req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
          defer.reject(e);
        });
        req.write(postData);
        req.end();
    }
    else
        defer.reject("");
    return defer.promise;
}*/

module.exports = serverConfig;