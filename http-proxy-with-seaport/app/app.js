function start() {
    var http = require("http");
    var express = require("express");
    var bodyParser = require("body-parser");
    var methodOverride = require("method-override");
    var morgan = require("morgan");
    var errorhandler = require("errorhandler");
    var responseTime = require("response-time");
    var seaport = require("seaport");

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

    app.get("/", function (req, res) {
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

    var server = http.createServer(app).listen(app.get("port"), function () {
        console.log("Express Server listening on port", server.address().port, "-> pid:", process.pid);
    });

    // If stopped / crashed
    process.on("SIGINT", function () {
        // Unsubscribe from seaport
        ports.free("http-server@0.0.1");

        setImmediate(function() {
            process.exit(1);
        });
    });

    return {
          server: server
        , app: app
    };
}

// Check if this is the entry point (and application should be started)
// or we should exports the start method to be available for require
// When a file is run directly from Node, require.main is set to its module
if (module === require.main) {
    var app = start();
}
else {
    module.exports = start;
}