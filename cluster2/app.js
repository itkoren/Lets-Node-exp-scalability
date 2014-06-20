var Cluster = require("cluster2");
var express = require("express");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var morgan = require("morgan");
var errorhandler = require("errorhandler");
var responseTime = require("response-time");
var numCPUs = require("os").cpus().length;

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

// Initialize a new cluster2 which will manage the workers forking and load balancing
var cluster = new Cluster({
    // Hostname or IP for the app listening, defaults to 0.0.0.0
    host: app.get("ip"),
    // Port for the app listening
    port: app.get("port"),
    // When true starts a number of workers.
    // Use false to start the server as a single process.
    // Defaults to true
    cluster: true,
    // The number of workers to fork, defaults to os.cpus().length
    noWorkers: numCPUs - 1
    // .....
});

// Kick-Start the cluster
cluster.listen(function(callback) {
    console.log("Express Server listening on port", cluster.options.port, "-> pid:", process.pid);
    callback(app);
});