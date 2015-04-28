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

var fs = require('fs');
var util = require('util');
var when = require('when');
var nodeFn = require('when/node/function');
var settings;
var userDir;
var macronodesTemplatePath = __dirname+'/macronodes.json';

var macroNodes;

function setMacroNodes(json) {
    var defer = when.defer();
    defer.resolve(nodeFn.call(fs.writeFile,macronodesTemplatePath,JSON.stringify(json)).then(function(data) {
        util.log("[macro node] Initializing nodes");
        macroNodes = json;
        return macroNodes;
    }));
    return defer.resolve;
}

function getMacroNodes() {
    var defer = when.defer();
    fs.exists(macronodesTemplatePath, function(exists) {
        if (exists) {
            defer.resolve(nodeFn.call(fs.readFile,macronodesTemplatePath,'utf8').then(function(data) {
                macroNodes = JSON.parse(data);
                util.log("[macro node] Templates loaded");
                return macroNodes;
            }));
        } else {
            defer.resolve(nodeFn.call(fs.writeFile,macronodesTemplatePath,JSON.stringify([])).then(function(data) {
                util.log("[macro node] Initializing nodes");
                macroNodes = [];
                return macroNodes;
            }));
        }
    });
    return defer.promise;
}

function addMacroNodeTemplate(node) {
    var defer = when.defer();
    getMacroNodes()
    .then(function(nodes) {
        node.templateID = (1+Math.random()*4294967295).toString(16);
        nodes.push(node);
        //console.log(JSON.stringify(nodes, null, 4));
        saveToFile(JSON.stringify(nodes, null, 4));
        defer.resolve();
    });
    return defer.promise;
}


function saveToFile(str) {
    fs.writeFileSync(__dirname+'/macronodes.json', str);
}

/*function initMacroNodes() {
    if(!fs.existsSync(__dirname+'/macronodes.json')) {
        var json = [];
        saveToFile(JSON.stringify(json, null, 4));
        return json;
    }
    return require('./macronodes.json');
}*/

function loadTemplate(id) {
    var defer = when.defer();
    getMacroNodes()
    .then(function(data) {
        var found = false;
        data.forEach(function(node) {
            if(node.templateID == id)
                defer.resolve(node);
        });
        //if(!found)
            //defer.reject();
    })
    .otherwise(function() {
        defer.reject();
    });
    return defer.promise;
}

function getTemplate(id) {
    for(var i=0;i<macroNodes.length;i++) {
        if(macroNodes[i].templateID == id)
            return macroNodes[i];
    }
}

/*function getFlows(templateID) {
    var node = getTemplate(templateID);
    if(node !== undefined) {
    }
}*/

module.exports = {
    setMacroNodes: setMacroNodes,
    getMacroNodes: getMacroNodes,
    addMacroNode: addMacroNodeTemplate,
    //getFlows: getFlows,
    loadTemplate: loadTemplate,
    getTemplate: getTemplate,

    init: function(_settings) {
        settings = _settings;
        userDir = settings.userDir || process.env.NODE_RED_HOME;
    }
}

module.exports.__defineGetter__("macroNodes", function() { return macroNodes });