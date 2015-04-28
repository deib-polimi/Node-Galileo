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
var http = require('http');
var request = require('request');

var settings;
var RED;

var serverConfig = {

	init: function(app, _settings, _devices) {
		settings = _settings;

        app.post("/sendFlow",
            bodyparser.json(),
            function(req,res) {
                var json = req.body;
                sendFlow(json.deviceAddress, json.flows)
                .then(function() {
                    res.status(204).end();
                })
                .otherwise(function(err) {
                    util.log("otherwise");
                    util.log("error: " + err);
                    res.status(500).send("Failed Send flows on some device");
                });
            },
            function(error,req,res,next) {
                util.log("(this)error: " + error);
                res.status(400).send("error");
            }
        );

    	app.post("/sendDevices",
            bodyparser.json(),
            function(req,res) {
                var json = req.body;
                sendDevices(json.deviceAddress, json.list)
              	.then(function() {
                	util.log("[DEVICE MANAGER] device list sent to: "+json.deviceAddress);
                    res.status(204).end();
                })
                .otherwise(function(err) {
                    res.status(500).send(err.message);
                });
            },
            function(error,req,res,next) {
                util.log("error: " + error);
                res.status(400).send("invalid device list");
            }
        );

        app.post("/devices",
            bodyparser.json(),
            function(req,res) {
                util.log("[DEVICE MANAGER] device list received");
                var devices = req.body;
                _devices.setDevices(devices);
                res.status(204).end();
            },
            function(error,req,res,next) {
            	util.log(error.message);
                res.status(400).send("Invalid Device list");
            }
        );

        app.get("/devices", function(req,res) {
            //util.log("[DEVICES] total devices: " + _devices.getAllDevices().length);
            res.json(_devices.getAllDevices());
        });

        app.get("/currentDevice", function(req,res) {
            util.log("[DEVICE MANAGER] send current device: "+JSON.stringify(_devices.getCurrentDevice()));
            res.json(_devices.getCurrentDevice());
        });

        app.post("/getDeviceID",
            bodyparser.json(),
            function(req,res) {
                var device = req.body;
                getDevice(device.deviceAddress)
                .then(function(result) {
                    //util.log("[DEVICE MANAGER] device list sent to: "+json.deviceAddress);
                    res.json(String(result));
                })
                .otherwise(function(err) {
                    res.status(500).send(err.message);
                });
                /*var url = "http://"+device.deviceAddress + ":"+settings.uiPort+"/admin/currentDevice";
                util.log('url: '+url);
                http.get(url, function(response) {
                    util.log("Got response: " + response.statusCode);
                    util.log(typeof response.body);
                    res.json(response.body);
                }).on('error', function(e) {
                    util.log("Got error: " + e.message);
                    res.status(400).end();
                });*/
            },
            function(error,req,res,next) {
                util.log("error: " + error);
                res.status(400).send("invalid device list");
            }
        );
	}
}

/**
* Get device ID
* @param deviceAddress the address of the device
* @return a promise for the receiving of the device ID
*/
function getDevice(deviceAddress) {
    var defer = when.defer();
    if(deviceAddress != null) {
        var options = {
          hostname: deviceAddress,
          port: settings.uiPort,
          path: settings.httpAdminRoot+'currentDevice',
          method: 'GET'
        };

        var req = http.request(options, function(res) {
            //console.log('STATUS: ' + res.statusCode);
            if(res.statusCode != 200)
                defer.reject("");

            res.on('data', function (chunk) {
                defer.resolve(chunk);
            });
        });

        req.on('error', function(e) {
          util.log('[DEVICE MANAGER] problem with request: ' + e.message);
          //util.log('[DEVICE MANAGER] unable to update device list on ' + deviceAddress);
          defer.reject(e);
        });
        req.end();
    }
    else
        defer.reject("");
    return defer.promise;
}

/**
* Send device list remotely
* @param deviceAddress the address of the device
* @param devices the device list
* @return a promise for the sending of the list
*/
function sendDevices(deviceAddress, devices) {
    var defer = when.defer();
    util.log('[DEVICE MANAGER] send devices to: '+deviceAddress);
    if(deviceAddress != null && devices != null) {

        var postData = JSON.stringify(devices);
        var options = {
          hostname: deviceAddress,
          port: settings.uiPort,
          path: settings.httpAdminRoot+'devices',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        };

        var req = http.request(options, function(res) {
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
}

/**
* Send a flow remotely
* @param deviceAddress the address of the device
* @param flow the flow
* @return a promise for the sending of the flow
*/
function sendFlow(deviceAddress, flow) {
    var defer = when.defer();
    if(deviceAddress != null && flow != null) {

        var postData = JSON.stringify(flow);
        //console.log(postData);
        var options = {
          hostname: deviceAddress,
          port: settings.uiPort,
          path: settings.httpAdminRoot+'flows',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        };
        util.log("send flow to "+deviceAddress+" path: "+settings.httpAdminRoot+'flows');
        var req = http.request(options, function(res) {
            

            var responseString = '';

            res.on('data', function(data) {
                responseString += data;
            });

            res.on('end', function() {
                console.log('STATUS: ' + res.statusCode);
                if(res.statusCode == 204)
                    defer.resolve();
                else
                    defer.reject("error");
            });
        });

        req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
          defer.reject(e);
        });
        console.log(postData);
        req.write(postData);
        req.end();
    }
    else
        defer.reject("");
    return defer.promise;
}

module.exports = serverConfig;