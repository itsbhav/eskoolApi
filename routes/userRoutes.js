const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController")
const courseController = require("../controllers/courseController")
const lectureController=require("../controllers/lectureController")
const feeController = require("../controllers/feeController")
const userController = require("../controllers/userController")
const verifyJWT = require("../middleware/verifyJWT");
const verifyRoles = require("../middleware/verifyRole");

router.route("/").post(userController.createStudent)
router.use(verifyJWT);
router.use(verifyRoles(process.env.USER));
router.route("/")
    .get(userController.getUserById)
router.route("/class")
    .get(classController.getClass)
router.route("/course")
    .get(courseController.getCoursesByUserId)
    .post(courseController.enrollCourseAsMinor)
router.route("/fee")
    .get(feeController.getYourFee)
router.route("/mark")
    .get(feeController.getYourMarks)
router.route("/lecture")
    .get(lectureController.getLecturesByCourse)
router.route("/assignment")
    .get(lectureController.getAssignmentsByCourse)

module.exports = router;