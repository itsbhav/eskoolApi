const express = require("express");
const router = express.Router();
const youtube = require("../config/youtubeConn");

router.route("/").get(youtube.getToken);

module.exports = router;
