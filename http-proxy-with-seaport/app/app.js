var cluster = require("cluster");
var http = require("http");
var express = require("express");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var morgan = require("morgan");
var errorhandler = require("errorhandler");
var responseTime = require("response-time");
var numCPUs = require("os").cpus().length;
var seaport = require("seaport");

// Check whether it is a forked worker or master
if (cluster.isMaster) {
    // Fork workers.
    for (var i = 0; i < numCPUs - 1; i++) {
        cluster.fork();
    }

    cluster.on("exit", function(worker, code, signal) {
        console.log("worker " + worker.process.pid + " died");
        // We can use this handler to fork a new worker
        // instead of the one that died
        cluster.fork();
    });
}
else {
    // Workers can share any TCP connection
    // In this case its an Express server

    // Connect to the seaport service
    var ports = seaport.connect("localhost", 9090);

    // Register our server with the seaport service and get the port to listen on
    var port = ports.register("http-server@0.0.1");

    var app = express();

    if ("development" === app.get("env")) {
        // Gets called in the absence of NODE_ENV too!
        app.use(function (req, res, next) {
            // you always log
            console.error(" %s %s ", req.method, req.url);
            next();
        });
        app.use(morgan({ format: "dev", immediate: true }));
        app.use(errorhandler({ dumpExceptions: true, showStack: true }));
    }
    else if ("production" === app.get("env")) {
        app.use(errorhandler());
    }

    // all environments
    app.set("port", port);
    app.set("ip", process.env.IP || "0.0.0.0");
    app.use(bodyParser());
    app.use(methodOverride());
    // Add the responseTime middleware
    app.use(responseTime());

    app.get("/", function(req, res) {
        res.format({
            "text/plain": function() {
                res.send("welcome");
            },
            "text/html": function() {
                res.send("<b>welcome</b>");
            },
            "application/json": function() {
                res.json({ message: "welcome" });
            },
            "default": function() {
                res.send(406, "Not Acceptable");
            }
        });
    });

    var server = http.createServer(app).listen(app.get("port"), function(){
        console.log("Express Server listening on port", server.address().port);
    });

    // If stopped / crashed
    process.on("SIGINT", function () {
        // Unsubscribe from seaport
        ports.free("http-server@0.0.1");
    });
}