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

var util = require('util');
var when = require('when');
var clone = require("clone");

module.exports = function(RED) {
  function MacroNode(config) {
        RED.nodes.createNode(this,config);
        this.templateID = config.templateID;
        this.inputNode = config.inputNode;
        //this.inputNodes = config.inputNodes;
        this.outputNodes = config.outputNodes;
        var node = this;
        //var def = RED.comms.macroNodes.getMacroNodeTemplate(this.templateID);
        //if(def !== undefined) {
        this.on('input', function(msg) {
          console.log('input received');
          if(node.inputNode != null) {
            console.log("input found");
            var n = RED.nodes.getNode(node.inputNode);
            var m = clone(msg);
            n.receive(m);
          }
        });

        this.on('macroNodeOutput', function(msg) {
          this.log('output received');
          var index = node.outputNodes.indexOf(msg.child);
          if(index != -1) {
            if(index == 0)
              node.send(msg.msg);
            else {
              var message = Array();
              var i;
              for(i=0;i<index;i++)
                message[i] = null;
              message.push(msg.msg);
              node.send(message);
            }
          }
        });
        //}
    }

    /*var list = RED.comms.macroNodes.getMacroNodes();

    for(var i in list) {
      var n = list[i];
      console.log(n.name);
      RED.nodes.registerType(n.name, MacroNode);
    }*/

    RED.nodes.registerType('MacroNode', MacroNode);
}