// Get the host
var host = window.document.location.host.replace(/:.*/, "");

// Open a new secure WebSocket connection (wss)
var ws = new WebSocket("wss://" + host + ":8000");

// Optional callback, invoked if a connection error has occurred
ws.onerror = function (error) {
    console.log(error);
};

// Optional callback, invoked when the connection is terminated
ws.onclose = function () {};

// Optional callback, invoked when a WebSocket connection is established
ws.onopen = function () {
    // Client-initiated message to the server
    ws.send("Connection established. Hello server!");
    document.getElementById("connected").innerHTML = "Connecting";
};

// A callback function invoked for each new message from the server
ws.onmessage = function(msg) {

    // Parse the message
    var data = msg && msg.data && JSON.parse(msg.data);

    if (data.connected) {
        document.getElementById("connected").innerHTML = data.connected;
    }
    else {
        updateStats(data);
    }
};

function updateStats(memuse) {
    document.getElementById("rss").innerHTML = memuse.rss;
    document.getElementById("heapTotal").innerHTML = memuse.heapTotal;
    document.getElementById("heapUsed").innerHTML = memuse.heapUsed;
}