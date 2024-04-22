const express = require("express");
const router = express.Router();
const advertisementsController = require("../controllers/advertisementsController");
const classController = require("../controllers/classController")
const courseController = require("../controllers/courseController")
const noticesController = require("../controllers/noticesController")

router.route("/advertisement").get(advertisementsController.getAll)
router.route("/class").get(classController.getClass)
router.route("/course").get(courseController.getAllCourses)
router.route("/notice").get(noticesController.getAll)

module.exports = router;