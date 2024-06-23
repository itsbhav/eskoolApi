const express = require("express");
const router = express.Router();
const verifier = require("../utility/verifyEmail");
const loginLimiter = require("../middleware/loginLimiter");

router.route("/").get(verifier.verifyPassMail);

router.route("/").post(loginLimiter, verifier.passMail);

router.route("/submit").post(verifier.verificationSuccess);

module.exports = router;
