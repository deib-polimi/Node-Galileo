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
var devices = require('../devices');
var dashboard = require('./dashboard_core');
var bodyparser = require('body-parser');
var RED = require('../node-red');

var serverConfig = {

	init: function(_app, nodes) {

		//settings = _settings;

        /*app.post("/sendFlow",
            bodyparser.json(),
            function(req,res) {
                var json = req.body;
                sendFlow(json.deviceAddress, json.flows)
                .then(function() {
                    res.status(204).end();
                })
                .otherwise(function(err) {
                    util.log("error: " + err);
                    res.status(500).send("Failed Send flows on some device");
                });
            },
            function(error,req,res,next) {
                util.log("(this)error: " + error);
                res.status(400).send("error");
            }
        );*/

        /*_app.get("/", function(req,res) {
            res.render('dashboard', {
                "dashboard": dashboard.status,
                "deviceID": devices.getCurrentDevice().ID
            });
        });*/

        _app.get("/json", function(req, res) {
            var status = dashboard.status;
            for(var i in status) {
                for(var j in status[i].status) {
                    if(status[i].status[j] != "online")
                        status[i].connected = false;
                }
            }
            var json = {};
            json.status = status;
            var values = [];
            for(var i in dashboard.values) {
                values.push(dashboard.values[i]);
            }
            json.values = values;
            var actions = [];
            for(var i in dashboard.actions) {
                var a = dashboard.actions[i];
                var order = parseInt(a.order);
                if(order != NaN)
                    actions.splice(order, 0, a);
                else
                    actions.push(a);
            }
            /*var test = {
                "name": "Imposta",
                "title": "Imposta temperatura",
                "id": "id",
                "order": "1",
                "params": [
                    {
                        "name":"temperatura",
                        "field": "temperatura",
                        //"type": "text"
                    }
                ]
            };
            actions.push(test);
            test = {
                "name": "Imposta",
                "title": "Sono a casa",
                "id": "id",
                "order": "0"
            };
            actions.push(test);*/
            json.actions = actions;
            res.json(json);
        });

        _app.post("/action", bodyparser.urlencoded({ extended: false }), function(req, res) {
            console.log(req.body);
            var body = req.body;
            var n = nodes.getNode(body.id);
            var msg = req.body;
            delete msg.id;
            if(n)
                n.receive(msg);
            res.status(204).end();
        });
	}
}

module.exports = serverConfig;