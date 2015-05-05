
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

var WS = require("ws");
var util = require("util");
var devices = require('../devices');

var wsServer;

var server;
var settings;
var is_server;
var serverPath;

var client;
var interval;

var devices_status;
var devices_connected;
var activeConnections = [];

var values = {};
var actions = {};

var DEVICE_STATUS = 0;
var DASHBOARD_MESSAGE = 1;

function init(_server, _settings, _is_server) {
    server = _server;
    settings = _settings;
    is_server = _is_server;
    initDevices();
}

function initDevices() {
    devices_status = {};
    devices_connected = {};
    var dev = devices.getAllDevices();
    for(var i in dev) {
        var device = dev[i];
        if(!devices_status.hasOwnProperty(device.ID)) {
            devices_status[device.ID] = {};
            devices_status[device.ID].name = device.name;
            //devices_status[device.ID].ping = "";
            //devices_status[device.ID].values = {};
            devices_status[device.ID].status = {};
            if(device.ID == devices.getCurrentDevice().ID)
                devices_status[device.ID].connected = true;
            else
                devices_status[device.ID].connected = false;
        }
    }
}

function start() {
    var webSocketKeepAliveTime = settings.webSocketKeepAliveTime || 15000;
    var path = settings.httpDashboardRoot || "/dashboard";
    serverPath = path + (path.slice(-1) == "/" ? "":"/") + "comms";
    if(is_server) {
        if(wsServer === undefined) {
            wsServer = new WS.Server({server:server,path:serverPath});

            wsServer.on('connection',function(ws) {
                util.log('[dashboard:comms] connection accepted');
                activeConnections.push(ws);
                ws.on('close',function() {
                    util.log('[dashboard:comms] connection closed');
                    for(i in devices_connected) {
                        var d = devices_connected[i];
                        var dev = devices_status[i];
                        if(d == ws) {
                            delete devices_connected[i];
                            dev.connected = false;
                        }
                    }
                    for (var i=0;i<activeConnections.length;i++) {
                        if (activeConnections[i] === ws) {
                            activeConnections.splice(i,1);
                            break;
                        }
                    }
                });
                ws.on('message', function(data,flags) {
                    var msg = null;
                    try {
                        msg = JSON.parse(data);
                    } catch(err) {
                        util.log("[dashboard:comms] received malformed message : "+err.toString());
                        return;
                    }
                    if(msg.type == DEVICE_STATUS) {
                        //util.log('[dashboard:comms] ping received');
                        var id = msg.id;
                        if(id && devices_status.hasOwnProperty(id)) {
                            var status = msg.content;
                            devices_status[id].status = status;
                            devices_status[id].connected = true;
                            devices_connected[id] = ws;
                            //console.log(JSON.stringify(status));
                        }
                    }
                    if(msg.type == DASHBOARD_MESSAGE) {

                    }
                });
                ws.on('error', function(err) {
                    util.log("[dashboard:comms] error : "+err.toString());
                });
            });

            wsServer.on('error', function(err) {
                util.log("[dashboard:comms] server error : "+err.toString());
            });
        }
    }
    else {
        client = null;
        connectWS();
    }

    //lastSentTime = Date.now();

    /*heartbeatTimer = setInterval(function() {
        var now = Date.now();
        if (now-lastSentTime > webSocketKeepAliveTime) {
            publish("hb",lastSentTime);
        }
    }, webSocketKeepAliveTime);*/
}

function connectWS() {
    util.log('[dashboard:comms] initializing connection..');
    var server = devices.getServer();
    var current = devices.getCurrentDevice();
    if(server !== undefined && server.deviceAddress !== undefined && server.deviceAddress != null) {
        //util.log('[dashboard:comms] server address found');
        var path = server.deviceAddress+":"+settings.uiPort+serverPath;
        path = "ws"+"://"+path;
        //util.log('[dashboard:comms] connect to '+server.deviceAddress);
        if(client == null) {
            client = new WS(path);
            client.on('open', function() {
                util.log('[dashboard:comms] connection created');
                interval = setInterval(execPing, 5000);
            });

            client.on('close', function() {
                if(interval)
                    clearInterval(interval);
                util.log('[dashboard:comms] connection closed');
                client = null;
                setTimeout(connectWS,1000);
            });
            client.on('error', function(err) {
                util.log('[dashboard:comms] cannot connect to '+path+'error: '+err.message);
                client = null;
                setTimeout(connectWS,1000);
            });
        }
    }
}

function stop() {
    //if(wsServer)
        //wsServer.close();
    if(interval)
        clearInterval(interval);
    if(client) {
        client.close();
        client = null;
    }
}

var execPing = function() {
    var ID = devices.getCurrentDevice().ID;
    var deviceAddress = devices.getServer().deviceAddress;
    var status = devices_status[ID].status;
    var message = { 'id': ID, 'content':status, 'type':DEVICE_STATUS };
    var data = JSON.stringify(message);
    try{
        client.send(data);
    }
    catch(e) {
        util.log("[dashboard:comms] error : "+e.toString());
    }
};

var setValue = function(id, value) {
    values[id] = value;
}

var setAction = function(id, value) {
    actions[id] = value;
}

var reset = function(flows) {
    util.log('[dashboard] reset');
    for(var i in actions) {
        var found = false;
        for(var j in flows) {
            var n = flows[j];
            if(n.id == i)
                found = true;
        }
        if(!found)
            delete actions[i];
    }
    for(var i in values) {
        var found = false;
        for(var j in flows) {
            var n = flows[j];
            if(n.id == i)
                found = true;
        }
        if(!found)
            delete values[i];
    }
}

var notifyStatus = function(key, value) {
    devices_status[devices.getCurrentDevice().ID].status[key] = value;
}

function restart() {
    stop();
    initDevices();
    start();
}

var dashboard = {
    init: init,
    start:start,
    restart:restart,
    notifyStatus:notifyStatus,
    setValue:setValue,
    setAction:setAction,
    reset:reset
}

dashboard.__defineGetter__("status", function() { return devices_status });
dashboard.__defineGetter__("values", function() { return values });
dashboard.__defineGetter__("actions", function() { return actions });

module.exports = dashboard;