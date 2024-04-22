const express = require('express')
const router = express.Router()
const youtube = require('../config/youtubeConn')
const verifyJWT = require("../middleware/verifyJWT")   
const verifyRoles = require("../middleware/verifyRole");

router.use(verifyJWT);
router.use(verifyRoles(process.env.TEACHER));
router.route("/").get(youtube.setCreadentials);

module.exports = router