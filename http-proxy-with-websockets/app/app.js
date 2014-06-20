var http = require("http");
var app = require("./express");
var WebSocketServer = require("ws").Server;

var server = http.createServer(app).listen(app.get("port"), function(){
    console.log("Express Server listening on port", server.address().port, "-> pid:", process.pid);
});

// Initialize a ws server
var wss = new WebSocketServer({ server: server });

// Listen for 'connection' events and handle
wss.on("connection", function(conn) {

    // Listen for 'message' events from the client and handle
    conn.on("message", function(data) {
        console.log("received: %s", data);
    });

    // Send data to the client
    conn.send(JSON.stringify({ connected: true }));

    var interval = setInterval(function() {
        var welcome = "Data from " + app.get("ip") + ":" + app.get("port") + "->pid:" + process.pid;

        console.log("SEND:", welcome);
        
        conn.send(JSON.stringify(process.memoryUsage()), function() { /* ignore errors */ });
    }, 100);
    console.log("started client interval");

    conn.on("close", function() {
        console.log("stopping client interval");
        clearInterval(interval);
    });
});