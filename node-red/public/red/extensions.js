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

RED.loadMacroNodes = function() {
    $.get('macroNodes', function(data) {
        //console.log('all Macro Nodes: ' + data);
        RED.macroNodeSet = Array();
        for(i in data) {
            RED.macroNodeSet[data[i].templateID] = data[i];
        }
        RED.macroNodes = data;
    });
}

RED.loadDevices = function() {
    //console.log('loading devices');
    loadAllDevices();
    loadCurrentDevice();
}
    
function loadAllDevices() {
    $.get('devices', function(data) {
        //console.log('all devices: ' + data);
        RED.devices = data;
    });
}

function loadCurrentDevice() {
    $.get('currentDevice', function(data) {
        //console.log('current device: ' + data);
        RED.currentDevice = data;
    });
}