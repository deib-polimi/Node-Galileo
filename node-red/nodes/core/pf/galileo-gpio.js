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

module.exports = function(RED) {
   function TemperatureSensorNode(config) {
      RED.nodes.createNode(this,config);
      this.pin = config.pin;
      this.mode = config.mode;
      this.direction = config.direction;
      var node = this;
      var value = null;
      if(RED.galileo !== undefined && this.deviceID == RED.comms.devices.getCurrentDevice().ID) {
         if(this.direction == "input") {
            /*if(this.mode == "analog") {
               RED.galileo.analogRead(node.pin, function(data) {
                  value = data;
               });
            }
            else {
               RED.galileo.pinMode(node.pin, RED.galileo.MODES.INPUT);
               RED.galileo.digitalRead(node.pin, function(data) {
                  value = data;
               });
            }*/
         }
         else
            RED.galileo.pinMode(node.pin, RED.galileo.MODES.OUTPUT);
      }
      this.on('input', function(msg) {
         //this.log(value);
         if(this.direction == "input") {
            if(this.mode == "analog") {
               //RED.galileo.removeAnalogListeners(node.pin);
               RED.galileo.analogRead(node.pin, function(data) {
                  value = data;
                  msg.payload = data;
                  node.send(msg);
               });
            }
            else {
               RED.galileo.pinMode(node.pin, RED.galileo.MODES.INPUT);
               RED.galileo.digitalRead(node.pin, function(data) {
                  value = data;
                  msg.payload = data;
                  node.send(msg);
               });
            }
         }
            //msg.payload = value;
         else {
            if(this.mode == "digital")
               RED.galileo.digitalWrite(node.pin, msg.payload);
            else
               RED.galileo.analogWrite(node.pin, msg.payload);
            node.send(msg);
         }
         //node.send(msg);
      });
   }
   RED.nodes.registerType("gal-gpio",TemperatureSensorNode);
}