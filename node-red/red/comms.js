/**
 * Copyright 2014 IBM Corp.
 * Modified by Paolo Ferraris
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

var ws = require("ws");
var util = require("util");
var when = require('when');

var server;
var settings;

//my code
/*var devices;
var macroNodes;
var nodesServer;*/
//end

var wsServer;
var activeConnections = [];

var retained = {};

var heartbeatTimer;
var lastSentTime;


function init(_server,_settings) {
    server = _server;
    settings = _settings;
    //devices.init(_server.app, settings);
}

function start() {

    if (!settings.disableEditor) {
        var webSocketKeepAliveTime = settings.webSocketKeepAliveTime || 15000;
        var path = settings.httpAdminRoot || "/";
        path = path + (path.slice(-1) == "/" ? "":"/") + "comms";
        wsServer = new ws.Server({server:server,path:path});
        
        wsServer.on('connection',function(ws) {
            activeConnections.push(ws);
            ws.on('close',function() {
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
                if (msg.subscribe) {
                    handleRemoteSubscription(ws,msg.subscribe);
                }
            });
            ws.on('error', function(err) {
                util.log("[dashboard:comms] error : "+err.toString());
            });
        });
        
        wsServer.on('error', function(err) {
            util.log("[dashboard:comms] server error : "+err.toString());
        });
         
        lastSentTime = Date.now();
        
        heartbeatTimer = setInterval(function() {
            var now = Date.now();
            if (now-lastSentTime > webSocketKeepAliveTime) {
                publish("hb",lastSentTime);
            }
        }, webSocketKeepAliveTime);
    }
}

function stop() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
    }
    if (wsServer) {
        wsServer.close();
    }
}

function publish(topic,data,retain) {
    if (retain) {
        retained[topic] = data;
    } else {
        delete retained[topic];
    }
    lastSentTime = Date.now();
    activeConnections.forEach(function(conn) {
        publishTo(conn,topic,data);
    });
}

function publishTo(ws,topic,data) {
    var msg = JSON.stringify({topic:topic,data:data});
    try {
        ws.send(msg);
    } catch(err) {
        util.log("[red:comms] send error : "+err.toString());
    }
}

function handleRemoteSubscription(ws,topic) {
    var re = new RegExp("^"+topic.replace(/([\[\]\?\(\)\\\\$\^\*\.|])/g,"\\$1").replace(/\+/g,"[^/]+").replace(/\/#$/,"(\/.*)?")+"$");
    for (var t in retained) {
        if (re.test(t)) {
            publishTo(ws,t,retained[t]);
        }
    }
}

//my code

/**
* Execute a node remotely
* @param deviceID the id of the device
* @param nodeID the id of the node
* @param msg the message sent to the node
* @return a promise for the starting of the node
*/
/*function executeOnDevice(deviceID, nodeID, msg) {

    var deviceList = devices.getAllDevices();

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

//end

module.exports = {
    init:init,
    start:start,
    stop:stop,
    publish:publish
}
