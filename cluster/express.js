var cluster = require("cluster");
var http = require("http");
var express = require("express");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var morgan = require("morgan");
var errorhandler = require("errorhandler");
var responseTime = require("response-time");
var numCPUs = require("os").cpus().length;

// cluster.schedulingPolicy = cluster.SCHED_RR;

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
    app.set("port", process.env.PORT || 8000);
    app.set("ip", process.env.IP || "0.0.0.0");
    app.use(bodyParser());
    app.use(methodOverride());
    // Add the responseTime middleware
    app.use(responseTime());

    app.get("/", function(req, res) {
        var welcome = "Welcome from " + app.get("ip") + ":" + app.get("port") + "->pid:" + process.pid;

        console.log("SEND:", welcome);

        res.format({
            "text/plain": function() {
                res.send(welcome);
            },
            "text/html": function() {
                res.send("<b>" + welcome + "</b>");
            },
            "application/json": function() {
                res.json({ message: welcome });
            },
            "default": function() {
                res.send(406, "Not Acceptable");
            }
        });
    });

    var server = http.createServer(app).listen(app.get("port"), function(){
        console.log("Express Server listening on port", server.address().port, "-> pid:", process.pid);
    });
}

// This sounds easy enough, as most things in Node.js do.
// But as usual, real life is a tad messier.
// After testing the clustering on various machines and platforms,
// the Node.js team noticed that some machines tend to favor only a couple of workers from the entire pool.
// As a result, starting from the upcoming Node version 0.12, workers will be assigned in a ’round-robin’ fashion.
// This policy will be the default on most machines (although you can defeat it by adding this line before creating workers):

/*
 // Set this before calling other cluster functions.
 cluster.schedulingPolicy = cluster.SCHED_NONE;
 */

// You can read more about it in the following  StrongLoop blog post:
// http://strongloop.com/strongblog/whats-new-in-node-js-v0-12-cluster-round-robin-load-balancing/