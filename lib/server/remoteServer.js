//Server
"use strict";

var port = 9000;
console.log("start remote server on port " + port);

var PeerServer = require('peer').PeerServer;
var server = PeerServer({port: port, path: '/touchController'});