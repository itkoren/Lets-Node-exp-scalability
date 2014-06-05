var http = require("http");
var httpProxy = require("http-proxy");

// Get the Port
var port = process.env.PORT || 8000;

// Define the servers
var servers = [{
    host: "0.0.0.0",
    port: 8081
}, {
    host: "0.0.0.0",
    port: 8080
}];

// Create the reverse proxy server
var proxy = httpProxy.createServer();

var server = http.createServer(function (req, res) {
    // A simple Round Robin implementation
    // Get the worker server that should process the current request
    var target = servers.shift();

    // Proxy the request to the selected worker server
    console.log("balancing request to:", target);
    proxy.web(req, res, { target: target });

    // Add the processing worker server to the end of the list
    servers.push(target);
}).listen(process.env.PORT || 8000, process.env.HOST || "0.0.0.0", function() {
    console.log("HTTP Reverse Proxy Server Started. Listening on " + server.address().address + " : Port " + server.address().port);
});