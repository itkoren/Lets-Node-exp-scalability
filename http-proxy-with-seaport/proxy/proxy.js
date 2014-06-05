var http = require("http");
var httpProxy = require("http-proxy");
var seaport = require("seaport");

// Connect to the seaport service
var ports = seaport.connect("localhost", 9090);

// Get the Port
var port = process.env.PORT || 8000;
var i = -1;

// Create the reverse proxy server
var proxy = httpProxy.createServer();

var server = http.createServer(function (req, res) {
    // A simple Round Robin implementation
    // Get the available workers addresses for our http server
    var addresses = ports.query("http-server@0.0.1");

    // If there are not workers, give an error
    if (!addresses.length) {
        res.writeHead(503, { "Content-Type": "text/plain" });
        res.end("Service unavailable");
        return;
    }

    // Get the index of the worker server that should process the current request
    i = (i + 1) % addresses.length;

    // Proxy the request to the selected worker server
    console.log("balancing request to:", addresses[i]);
    proxy.web(req, res, { target: addresses[i] });
}).listen(process.env.PORT || 8000, process.env.HOST || "0.0.0.0", function() {
    console.log("HTTP Reverse Proxy Server Started. Listening on " + server.address().address + " : Port " + server.address().port);
});