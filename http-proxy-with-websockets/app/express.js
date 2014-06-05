var path = require("path");
var express = require("express");
var morgan = require("morgan");
var errorhandler = require("errorhandler");
var responseTime = require("response-time");
var routes = require("./routes/index");

var app = module.exports = express();

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
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.use(express.static(path.join(__dirname, "public")));

// Add the responseTime middleware
app.use(responseTime());

app.use("/", routes);