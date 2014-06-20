var https = require("https");
var fs = require("fs");
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

//
// Create a HttpProxy object for each target
//
var proxies = servers.map(function (target) {
    return new httpProxy.createProxyServer({
        target: target
    });
});

//
// Get the proxy at the front of the array, put it at the end and return it
// If you want a fancier balancer, put your code here
//
function nextProxy() {
    var proxy = proxies.shift();
    proxies.push(proxy);
    return proxy;
}

// Load the certificates
var options = {
    key: fs.readFileSync(__dirname + "/key.pem"),
    cert: fs.readFileSync(__dirname + "/key-cert.pem")
};

var server = https.createServer(options, function (req, res) {
    // A simple Round Robin implementation
    // Get the worker server that should process the current request
    var target = nextProxy();

    // If there are not workers, give an error
    if (!target) {
        res.writeHead(503, { "Content-Type": "text/plain" });
        res.end("Service unavailable");
        return;
    }

    // Proxy the request to the selected worker server
    console.log("balancing request to:", target.options.target);
    target.web(req, res);
}).listen(process.env.PORT || 8000, process.env.HOST || "0.0.0.0", function() {
    console.log("HTTP Reverse Proxy Server Started. Listening on " + server.address().address + " : Port " + server.address().port);
});

//
// Get the 'next' proxy and send the upgrade request
//
server.on("upgrade", function (req, socket, head) {
    // A simple Round Robin implementation
    // Get the worker server that should process the current request
    var target = nextProxy();

    target.ws(req, socket, head);
});