// Include The 'express' Module
var express = require("express");

// Initialize a new express router
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res) {
    res.render("index", { title: "Hello WebSockets" });
});

module.exports = router;