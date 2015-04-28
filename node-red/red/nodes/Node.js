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

var util = require("util");
var EventEmitter = require("events").EventEmitter;
var clone = require("clone");
var when = require("when");

var flows = require("./flows");
var comms = require("../comms");

function Node(n) {
    this.id = n.id;
    flows.add(this);
    this.type = n.type;
    //my code
    this.father = n.father;
    this.deviceID = n.deviceID;
    //end
    if (n.name) {
        this.name = n.name;
    }
    this.wires = n.wires||[];
}

util.inherits(Node,EventEmitter);

Node.prototype._on = Node.prototype.on;

Node.prototype.on = function(event,callback) {
    var node = this;
    if (event == "close") {
        if (callback.length == 1) {
            this.close = function() {
                return when.promise(function(resolve) {
                    callback.call(node,function() {
                        resolve();
                    });
                });
            }
        } else {
            this.close = callback;
        }
    } else {
        this._on(event,callback);
    }
}

Node.prototype.close = function() {
}

Node.prototype.send = function(msg) {
    // instanceof doesn't work for some reason here
    if (msg == null) {
        return;
    } else if (!util.isArray(msg)) {
        if(!msg.hasOwnProperty("msg_id"))
            msg["msg_id"] = (1+Math.random()*4294967295).toString(16);
        msg = [msg];
    }
    //my code
    if(this.father) {
        //console.log("punto 0");
        var father = flows.get(this.father);
        if(father) {
            //console.log("punto 1");
            //console.log(father);
            for(var i = 0; i<father.outputNodes.length; i++) {
                var c = father.outputNodes[i];
                /*console.log("");
                console.log(c);
                console.log(c.id);
                console.log(this.id);
                console.log("");*/
                if(c.id == this.id) {
                    //console.log("punto 2");
                    var outputIndex = c.output;
                    if(msg.length - 1 >= outputIndex) {
                        var json = {
                            "msg": msg[outputIndex],
                            "child": c
                        };
                        father.emit("macroNodeOutput",json);
                    }
                }
            }
        }
    }
    //end
    for (var i=0;i<this.wires.length;i++) {
        var wires = this.wires[i];
        if (i < msg.length) {
            if (msg[i] != null) {
                var msgs = msg[i];
                if (!util.isArray(msg[i])) {
                    msgs = [msg[i]];
                }
                //if (wires.length == 1) {
                //    // Single recipient, don't need to clone the message
                //    var node = flows.get(wires[0]);
                //    if (node) {
                //        for (var k in msgs) {
                //            var mm = msgs[k];
                //            node.receive(mm);
                //        }
                //    }
                //} else {
                    // Multiple recipients, must send message copies
                    for (var j=0;j<wires.length;j++) {
                        var node = flows.get(wires[j]);
                        if (node) {
                            for (var k=0;k<msgs.length;k++) {
                                var mm = msgs[k];
                                // Temporary fix for #97
                                // TODO: remove this http-node-specific fix somehow
                                var req = mm.req;
                                var res = mm.res;
                                delete mm.req;
                                delete mm.res;
                                var m = clone(mm);
                                if (req) {
                                    m.req = req;
                                    mm.req = req;
                                }
                                if (res) {
                                    m.res = res;
                                    mm.res = res;
                                }
                                //my code
                                if(node.deviceID === undefined) {
                                    this.log("send to server: " + node.id);
                                    var server = comms.devices.getServer();
                                    if(server.ID == comms.devices.getCurrentDevice().ID) {
                                        node.receive(m);
                                    }
                                    else {
                                        comms.executeOnDevice(server.ID, node.id, m);
                                    }
                                }
                                else {
                                    if(comms.devices.getCurrentDevice().ID != node.deviceID) {
                                        this.log("send to node: " + node.id + " in device: " + node.deviceID + " message: " + JSON.stringify(m));
                                        comms.executeOnDevice(node.deviceID, node.id, m);
                                    }
                                    else {
                                        node.receive(m);
                                    }
                                }

                                
                                //end
                            }
                        }
                    }
                //}
            }
        }
    }
}

Node.prototype.receive = function(msg) {
    if(msg !== undefined)
        this.log("received: " + msg.payload);
    this.emit("input",msg);
}

function log_helper(self, level, msg) {
    var o = {level:level, id:self.id, type:self.type, msg:msg};
    if (self.name) {
        o.name = self.name;
    }
    self.emit("log",o);
}

Node.prototype.log = function(msg) {
    log_helper(this, 'log', msg);
}

Node.prototype.warn = function(msg) {
    log_helper(this, 'warn', msg);
}

Node.prototype.error = function(msg) {
    log_helper(this, 'error', msg);
}

/**
 * status: { fill:"red|green", shape:"dot|ring", text:"blah" }
 */
Node.prototype.status = function(status) {
    comms.publish("status/"+this.id,status,true);
}
module.exports = Node;
