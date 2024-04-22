const express = require("express");
const router = express.Router();
const verifier = require("../utility/verifyEmail")

router.route("/").get(verifier.verifyMail)

module.exports = router;