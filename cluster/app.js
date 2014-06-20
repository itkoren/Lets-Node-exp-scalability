var cluster = require("cluster");
var http = require("http");
var numCPUs = require("os").cpus().length;

// cluster.schedulingPolicy = cluster.SCHED_RR;

// Check whether it is a forked worker or master
if (cluster.isMaster) {
    // Fork workers.
    for (var i = 0; i < numCPUs - 1; i++) {
        var worker = cluster.fork();

        worker.on("message", function(msg) {
            if (msg.memory) {
                console.log("Worker", msg.process, "is using", msg.memory.rss, "bytes of memory");
            }
        });
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
    // In this case its an HTTP server
    var server = http.createServer(function(req, res) {
        var welcome = "Welcome from " + server.address().address + ":" + server.address().port + "->pid:" + process.pid;

        console.log("SEND:", welcome);

        res.writeHead(200);
        res.end(welcome + "\n");
    }).listen(process.env.PORT || 8000, process.env.HOST || "0.0.0.0", function() {
        console.log("HTTP Server Started. Listening on", server.address().address, ": Port", server.address().port, "-> pid:", process.pid);
    });

    // Report stats
    setInterval(function report(){
        process.send({ memory: process.memoryUsage(), process: process.pid });
    }, 5000);
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