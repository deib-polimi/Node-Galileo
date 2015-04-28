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

var serverConfig = require('./serverConfig.js');
var express = require('express');
var path = require('path');
var core = require('./dashboard_core');
var RED = require('../node-red');
var dashboard_app;

var init = function(server, _app, settings, is_server, nodes) {

    core.init(server, settings, is_server);

    if(is_server) {
        dashboard_app = new express();
        _app.use(settings.httpDashboardRoot, dashboard_app);

        //app.use("/", express.static(path.join(__dirname, 'public')));
        // Add a simple route for static content served from 'public'
        //app.use("/",express.static("public"));
        //dashboard_app.set('views', path.join(__dirname, 'views'));
        //dashboard_app.set('view engine', 'jade');
        dashboard_app.use("/", express.static(path.join(__dirname, 'public')));
        //app.use(partials());
        /*dashboard_app.use("/dashboard", function(req, res, next) {
            _app.use("/", express.static(path.join(__dirname, 'public')));
            next();
        });
        _app.use(RED.settings.httpAdminRoot, function(req, res, next) {
            _app.use("/",express.static("public"));
            next();
        });*/

        serverConfig.init(dashboard_app, nodes);

        RED.httpAdmin.get('/resetStat', function(req, res) {
            core.reset(RED.nodes.getFlows());
            res.status(200).end();
        });
    }
}

var dashboard = {
	init:init,
    start:core.start,
    stop:core.stop,
    restart: core.restart,
    notifyStatus:core.notifyStatus,
    setValue:core.setValue,
    setAction:core.setAction
}

dashboard.__defineGetter__("values", function() { return core.values });
dashboard.__defineGetter__("status", function() { return core.status });
dashboard.__defineGetter__("actions", function() { return core.actions });

module.exports = dashboard;