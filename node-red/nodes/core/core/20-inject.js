/**
 * Copyright 2013, 2014 IBM Corp.
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

module.exports = function(RED) {
    var cron = require("cron");
    
    function InjectNode(n) {
        RED.nodes.createNode(this,n);
        this.topic = n.topic;
        this.payload = n.payload;
        this.payloadType = n.payloadType;
        this.repeat = n.repeat;
        this.crontab = n.crontab;
        this.once = n.once;
        var node = this;
        this.interval_id = null;
        this.cronjob = null;

        //my code
        if(this.deviceID == RED.comms.devices.getCurrentDevice().ID) {
            if (this.repeat && !isNaN(this.repeat) && this.repeat > 0) {
                this.repeat = this.repeat * 1000;
                this.log("repeat = "+this.repeat);
                this.interval_id = setInterval( function() {
                    node.emit("input",{});
                }, this.repeat );
            } else if (this.crontab) {
                if (cron) {
                    this.log("crontab = "+this.crontab);
                    this.cronjob = new cron.CronJob(this.crontab,
                        function() {
                            node.emit("input",{});
                        },
                        null,true);
                } else {
                    this.error("'cron' module not found");
                }
            }
        
            if (this.once) {
                setTimeout( function(){ node.emit("input",{}); }, 100);
            }
        }
        //end
    
        this.on("input",function(msg) {
            var msg = {topic:this.topic};
            if ( (this.payloadType == null && this.payload == "") || this.payloadType == "date") {
                msg.payload = Date.now();
            } else if (this.payloadType == null || this.payloadType == "string") {
                msg.payload = this.payload;
            } else {
                msg.payload = "";
            }
            this.send(msg);
            msg = null;
        });
    }
    
    RED.nodes.registerType("inject",InjectNode);
    
    InjectNode.prototype.close = function() {
        if (this.interval_id != null) {
            clearInterval(this.interval_id);
            this.log("inject: repeat stopped");
        } else if (this.cronjob != null) {
            this.cronjob.stop();
            this.log("inject: cronjob stopped");
            delete this.cronjob;
        }
    }
    
    RED.httpAdmin.post("/inject/:id", function(req,res) {
            var node = RED.nodes.getNode(req.params.id);
            var msg = {
                payload: ""
            };
            if (node != null) {
                try {
                    //my code
                    //console.log("inject to another device");
                    if(node.deviceID !== undefined && RED.comms.devices.getCurrentDevice().ID != node.deviceID) {
                        //console.log("inject send to node: " + node.id + "in device: " + node.deviceID + " message: " + msg.payload);
                        //console.log("ok")
                        RED.comms.executeOnDevice(node.deviceID, node.id, msg);
                    }
                    else
                        node.receive();
                    //end
                    //node.receive();
                    res.status(200).end();
                } catch(err) {
                    res.status(500).end();
                    node.error("Inject failed:"+err);
                    console.log(err.stack);
                }
            } else {
                res.status(404).end();
            }
    });
}
