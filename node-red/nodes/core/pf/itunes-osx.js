/**
 * Copyright 2013 IBM Corp.
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
    "use strict";
    var exec = require('child_process').exec;

    function iTunesNode(n) {
        RED.nodes.createNode(this,n);
        this.playlist = n.playlist;
        var node = this;
        this.on("input", function(msg) {
            var cl;
            var p;
            if(!msg.stop) {
                if(node.playlist)
                    p = node.playlist;
                else
                    p = msg.payload;
                //console.log(node.current);
                //console.log(p);
                if(node.current != p) {
                    node.current = p;
                    cl = "osascript -e 'tell application \"iTunes\" to play playlist \""+p+"\"'";
                }
                else {
                    cl = "osascript -e 'tell application \"iTunes\" \n if player state is paused then play \n end tell'";
                }
            }
            else {
                cl = "osascript -e 'tell application \"iTunes\" to pause'";
            }
            //node.log(cl);
            var child = exec(cl, function (error, stdout, stderr) {
                console.log(stdout);
                /*var msg2 = {payload:stderr};
                var msg3 = null;
                //console.log('[exec] stdout: ' + stdout);
                //console.log('[exec] stderr: ' + stderr);
                if (error !== null) {
                    msg3 = {payload:error};
                    //console.log('[exec] error: ' + error);
                }
                node.status({});
                node.send([msg,msg2,msg3]);*/
            });
        });
    }

    RED.nodes.registerType("itunes-osx",iTunesNode);
}
