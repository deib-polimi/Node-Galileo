/**
 * Copyright 2013 IBM Corp.
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
//var when = require('when');

var RED = (function() {

    function hideDropTarget() {
        $("#dropTarget").hide();
        RED.keyboard.remove(/* ESCAPE */ 27);
    }

    $('#chart').on("dragenter",function(event) {
        if ($.inArray("text/plain",event.originalEvent.dataTransfer.types) != -1) {
            $("#dropTarget").css({display:'table'});
            RED.keyboard.add(/* ESCAPE */ 27,hideDropTarget);
        }
    });

    $('#dropTarget').on("dragover",function(event) {
        if ($.inArray("text/plain",event.originalEvent.dataTransfer.types) != -1) {
            event.preventDefault();
        }
    })
    .on("dragleave",function(event) {
        hideDropTarget();
    })
    .on("drop",function(event) {
        var data = event.originalEvent.dataTransfer.getData("text/plain");
        hideDropTarget();
        RED.view.importNodes(data);
        event.preventDefault();
    });

    function filterDevices(devices, flows) {
        var newDevices = Array();
        if(flows.length == 0)
            newDevices = devices;   
        else {
            flows.forEach(function(node) {
                if(node.deviceID !== undefined) {
                    if(newDevices.filter(function(x){return x['ID'] == node.deviceID}).length == 0 && devices.filter(function(x){return x['ID'] == node.deviceID}).length == 1)
                        newDevices.push(devices.filter(function(x){return x['ID'] == node.deviceID})[0])
                }
            });
        }
        return newDevices;
    }

    function save(force) {
        if (RED.view.dirty()) {
            //$("#debug-tab-clear").click();  // uncomment this to auto clear debug on deploy

            if (!force) {
                var invalid = false;
                var unknownNodes = [];
                var notConfiguredMacroNodes = [];
                RED.nodes.eachNode(function(node) {
                    invalid = invalid || !node.valid;
                    if (node.type === "unknown") {
                        if (unknownNodes.indexOf(node.name) == -1) {
                            unknownNodes.push(node.name);
                        }
                        invalid = true;
                    }
                    if(node.type === "MacroNode" && node.templateID === undefined) {
                        notConfiguredMacroNodes.push(node.name);
                        invalid = true;
                    }
                });
                if (invalid) {
                    if (unknownNodes.length > 0) {
                        $( "#node-dialog-confirm-deploy-config" ).hide();
                        $( "#node-dialog-confirm-deploy-unknown" ).show();
                        $("#macro-node-dialog-confirm-deploy-not-configured").hide();
                        var list = "<li>"+unknownNodes.join("</li><li>")+"</li>";
                        $( "#node-dialog-confirm-deploy-unknown-list" ).html(list);
                    } else if (notConfiguredMacroNodes.length > 0) {
                        $( "#node-dialog-confirm-deploy-config" ).hide();
                        $( "#node-dialog-confirm-deploy-unknown" ).hide();
                        $("#macro-node-dialog-confirm-deploy-not-configured").show();
                        var list = "<li>"+notConfiguredMacroNodes.join("</li><li>")+"</li>";
                        $( "#macro-node-dialog-confirm-deploy-list" ).html(list);
                    } else {
                        $( "#node-dialog-confirm-deploy-config" ).show();
                        $( "#node-dialog-confirm-deploy-unknown" ).hide();
                        $("#macro-node-dialog-confirm-deploy-not-configured").hide();
                    }
                    $( "#node-dialog-confirm-deploy" ).dialog( "open" );
                    return;
                }
            }


            var nns = RED.nodes.createCompleteNodeSet();

            $("#btn-icn-deploy").removeClass('fa-download');
            $("#btn-icn-deploy").addClass('spinner');
            RED.view.dirty(false);
            
            var tmp_nns = nns.filter(function(x){return x['type'] != "tab"});
            
            var devices = filterDevices(RED.devices, tmp_nns);

            var canDeploy = true;

            devices.forEach(function(device){
                if(device.deviceAddress == null) {
                    RED.notify("<strong>Error</strong>: "+device.name+" has no IP address","error");
                    canDeploy = false;
                }
            });

            if(canDeploy) {
                $.ajax({
                    url:"resetStat",
                    type: "GET"
                }).done(function() {
                    
                }).fail(function() {
                    RED.notify("<strong>Error</strong>: unable to reset statistics","error");
                    console.log('error');
                    console.log(arguments);
                });
                
                //TODO test
                RED.devices.forEach(function(device) {
                    if(device.ID != RED.currentDevice.ID && devices.filter(function(d) { return d["ID"] == device["ID"]}).length == 0) {
                        var json = {
                            "flows": [],
                            "deviceAddress": device.deviceAddress
                        };
                        $.ajax({
                            url:"sendFlow",
                            type: "POST",
                            data: JSON.stringify(json),
                            contentType: "application/json; charset=utf-8"
                        }).done(function(data,textStatus,xhr) {
                            RED.notify("Successfully deployed on " + device.name,"success");
                        }).fail(function(xhr,textStatus,err) {
                            console.log("error status code: " + xhr.status);
                            RED.view.dirty(true);
                            RED.notify("<strong>Error</strong>: unable to deploy on "+device.name,"error");
                        }).always(function() {
                            $("#btn-icn-deploy").removeClass('spinner');
                            $("#btn-icn-deploy").addClass('fa-download');
                        });
                    }
                });
                devices.forEach(function(device) {
                    if(device.ID != RED.currentDevice.ID && device.ID !== undefined) {
                        var json = {
                            "flows": nns,
                            "deviceAddress": device.deviceAddress
                        };
                        $.ajax({
                            url:"sendFlow",
                            type: "POST",
                            data: JSON.stringify(json),
                            contentType: "application/json; charset=utf-8"
                        }).done(function(data,textStatus,xhr) {
                            //console.log("ok status code: " + xhr.status);
                            RED.notify("Successfully deployed on " + device.name,"success");
                            /*RED.nodes.eachNode(function(node) {
                                if (node.changed) {
                                    node.dirty = true;
                                    node.changed = false;
                                }
                                if(node.credentials) {
                                    delete node.credentials;
                                }
                            });
                            RED.nodes.eachConfig(function (confNode) {
                                if (confNode.credentials) {
                                    delete confNode.credentials;
                                }
                            });
                            // Once deployed, cannot undo back to a clean state
                            RED.history.markAllDirty();
                            RED.view.redraw();*/
                        }).fail(function(xhr,textStatus,err) {
                            console.log("error status code: " + xhr.status);
                            RED.view.dirty(true);
                            RED.notify("<strong>Error</strong>: unable to deploy on "+device.name,"error");
                            /*if (xhr.responseText) {

                                //RED.notify("<strong>Error</strong>: "+xhr.responseText,"error");
                            } else {
                                RED.notify("<strong>Error</strong>: no response from server","error");
                            }*/
                        }).always(function() {
                            $("#btn-icn-deploy").removeClass('spinner');
                            $("#btn-icn-deploy").addClass('fa-download');
                        });
                    }
                });
                if(devices.filter(function(d) { return d["ID"] == RED.currentDevice["ID"]}).length == 1) {
                    $.ajax({
                        url:"flows",
                        type: "POST",
                        data: JSON.stringify(nns),
                        contentType: "application/json; charset=utf-8"
                    }).done(function(data,textStatus,xhr) {
                        RED.notify("Successfully deployed on "+RED.currentDevice.name,"success");
                        RED.nodes.eachNode(function(node) {
                            if (node.changed) {
                                node.dirty = true;
                                node.changed = false;
                            }
                            if(node.credentials) {
                                delete node.credentials;
                            }
                        });
                        RED.nodes.eachConfig(function (confNode) {
                            if (confNode.credentials) {
                                delete confNode.credentials;
                            }
                        });
                        // Once deployed, cannot undo back to a clean state
                        RED.history.markAllDirty();
                        RED.view.redraw();
                    }).fail(function(xhr,textStatus,err) {
                        RED.view.dirty(true);
                        if (xhr.responseText) {
                            RED.notify("<strong>Error</strong>: "+xhr.responseText,"error");
                        } else {
                            RED.notify("<strong>Error</strong>: no response from server","error");
                        }
                    }).always(function() {
                        $("#btn-icn-deploy").removeClass('spinner');
                        $("#btn-icn-deploy").addClass('fa-download');
                    });
                }

            }
        }
    }

    $('#btn-deploy').click(function() { save(); });

    $( "#node-dialog-confirm-deploy" ).dialog({
            title: "Confirm deploy",
            modal: true,
            autoOpen: false,
            width: 530,
            height: 230,
            buttons: [
                {
                    text: "Confirm deploy",
                    click: function() {
                        save(true);
                        $( this ).dialog( "close" );
                    }
                },
                {
                    text: "Cancel",
                    click: function() {
                        $( this ).dialog( "close" );
                    }
                }
            ]
    });

    function loadSettings() {
        $.get('settings', function(data) {
            RED.settings = data;
            console.log("Node-RED: "+data.version);
            loadNodeList();
        });
    }
    //my code
    function loadDevices() {
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
    function loadMacroNodes() {
        $.get('macroNodes', function(data) {
            //console.log('all Macro Nodes: ' + data);
            RED.macroNodeSet = Array();
            for(i in data) {
                RED.macroNodeSet[data[i].templateID] = data[i];
            }
            RED.macroNodes = data;
        });
    }
    function loadCurrentDevice() {
        $.get('currentDevice', function(data) {
            //console.log('current device: ' + data);
            RED.currentDevice = data;
        });
    }
    //end
    function loadNodeList() {
        $.ajax({
            headers: {
                "Accept":"application/json"
            },
            cache: false,
            url: 'nodes',
            success: function(data) {
                RED.nodes.setNodeList(data);
                loadNodes();
            }
        });
    }

    function loadNodes() {
        $.ajax({
            headers: {
                "Accept":"text/html"
            },
            cache: false,
            url: 'nodes',
            success: function(data) {
                $("body").append(data);
                $(".palette-spinner").hide();
                $(".palette-scroll").show();
                $("#palette-search").show();
                loadFlows();
            }
        });
    }

    function loadFlows() {
        $.ajax({
            headers: {
                "Accept":"application/json"
            },
            cache: false,
            url: 'flows',
            success: function(nodes) {
                RED.nodes.import(nodes);
                RED.view.dirty(false);
                RED.view.redraw();
                RED.comms.subscribe("status/#",function(topic,msg) {
                    var parts = topic.split("/");
                    var node = RED.nodes.node(parts[1]);
                    if (node) {
                        node.status = msg;
                        if (statusEnabled) {
                            node.dirty = true;
                            RED.view.redraw();
                        }
                    }
                });
                RED.comms.subscribe("node/#",function(topic,msg) {
                    var i,m;
                    var typeList;
                    var info;
                    if (topic == "node/added") {
                        var addedTypes = [];
                        for (i=0;i<msg.length;i++) {
                            m = msg[i];
                            var id = m.id;
                            RED.nodes.addNodeSet(m);
                            if (m.loaded) {
                                addedTypes = addedTypes.concat(m.types);
                                $.get('nodes/'+id, function(data) {
                                    $("body").append(data);
                                });
                            }
                        }
                        if (addedTypes.length) {
                            typeList = "<ul><li>"+addedTypes.join("</li><li>")+"</li></ul>";
                            RED.notify("Node"+(addedTypes.length!=1 ? "s":"")+" added to palette:"+typeList,"success");
                        }
                    } else if (topic == "node/removed") {
                        for (i=0;i<msg.length;i++) {
                            m = msg[i];
                            info = RED.nodes.removeNodeSet(m.id);
                            if (info.added) {
                                typeList = "<ul><li>"+m.types.join("</li><li>")+"</li></ul>";
                                RED.notify("Node"+(m.types.length!=1 ? "s":"")+" removed from palette:"+typeList,"success");
                            }
                        }
                    } else if (topic == "node/enabled") {
                        if (msg.types) {
                            info = RED.nodes.getNodeSet(msg.id);
                            if (info.added) {
                                RED.nodes.enableNodeSet(msg.id);
                                typeList = "<ul><li>"+msg.types.join("</li><li>")+"</li></ul>";
                                RED.notify("Node"+(msg.types.length!=1 ? "s":"")+" enabled:"+typeList,"success");
                            } else {
                                $.get('nodes/'+msg.id, function(data) {
                                    $("body").append(data);
                                    typeList = "<ul><li>"+msg.types.join("</li><li>")+"</li></ul>";
                                    RED.notify("Node"+(msg.types.length!=1 ? "s":"")+" added to palette:"+typeList,"success");
                                });
                            } 
                        }
                    } else if (topic == "node/disabled") {
                        if (msg.types) {
                            RED.nodes.disableNodeSet(msg.id);
                            typeList = "<ul><li>"+msg.types.join("</li><li>")+"</li></ul>";
                            RED.notify("Node"+(msg.types.length!=1 ? "s":"")+" disabled:"+typeList,"success");
                        }
                    }
                });
            }
        });
    }

    var statusEnabled = false;
    
    function toggleStatus(state) {
        statusEnabled = state;
        RED.view.status(statusEnabled);
    }

    function showHelp() {

        var dialog = $('#node-help');

        //$("#node-help").draggable({
        //        handle: ".modal-header"
        //});

        dialog.on('show',function() {
            RED.keyboard.disable();
        });
        dialog.on('hidden',function() {
            RED.keyboard.enable();
        });

        dialog.modal();
    }

    $(function() {
        RED.menu.init({id:"btn-sidemenu",
            options: [
                {id:"btn-sidebar",icon:"fa fa-columns",label:"Sidebar",toggle:true,onselect:RED.sidebar.toggleSidebar},
                null,
                {id:"btn-node-status",icon:"fa fa-info",label:"Node Status",toggle:true,onselect:toggleStatus},
                null,
                {id:"btn-config-devices",icon:"fa fa-th-list",label:"Configure Devices",onselect:RED.view.showConfigDevicesDialog},
                null,
                {id:"btn-inspect-macronode",icon:"fa fa-th-list",label:"Inspect Macro Node",onselect:RED.view.inspectMacroNode},
                null,
                {id:"btn-import-menu",icon:"fa fa-sign-in",label:"Import...",options:[
                    {id:"btn-import-clipboard",icon:"fa fa-clipboard",label:"Clipboard...",onselect:RED.view.showImportNodesDialog},
                    {id:"btn-import-library",icon:"fa fa-book",label:"Library",options:[]}
                ]},
                {id:"btn-export-menu",icon:"fa fa-sign-out",label:"Export...",disabled:true,options:[
                    {id:"btn-export-clipboard",icon:"fa fa-clipboard",label:"Clipboard...",disabled:true,onselect:RED.view.showExportNodesDialog},
                    {id:"btn-export-library",icon:"fa fa-book",label:"Library...",disabled:true,onselect:RED.view.showExportNodesLibraryDialog},
                    {id:"btn-create-macronode",icon:"fa fa-book",label:"Create Macro Node...",disabled:true,onselect:RED.view.showExportMacroNodeDialog}
                ]},
                null,
                {id:"btn-config-nodes",icon:"fa fa-th-list",label:"Configuration nodes...",onselect:RED.sidebar.config.show},
                null,
                {id:"btn-workspace-menu",icon:"fa fa-th-large",label:"Workspaces",options:[
                    {id:"btn-workspace-add",icon:"fa fa-plus",label:"Add"},
                    {id:"btn-workspace-edit",icon:"fa fa-pencil",label:"Rename"},
                    {id:"btn-workspace-delete",icon:"fa fa-minus",label:"Delete"},
                    null
                ]},
                null,
                {id:"btn-keyboard-shortcuts",icon:"fa fa-keyboard-o",label:"Keyboard Shortcuts",onselect:showHelp},
                {id:"btn-help",icon:"fa fa-question",label:"Help...", href:"http://nodered.org/docs"}
            ]
        });

        RED.keyboard.add(/* ? */ 191,{shift:true},function(){showHelp();d3.event.preventDefault();});
        loadSettings();
        loadDevices();
        loadMacroNodes();
        RED.comms.connect();
    });

    return {
        loadDevices: loadDevices,
        loadMacroNodes: loadMacroNodes
    };
})();
