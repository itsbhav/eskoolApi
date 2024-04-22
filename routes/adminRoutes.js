const express = require("express");
const router = express.Router();
const advertisementsController = require("../controllers/advertisementsController");
const classController = require("../controllers/classController")
const courseController = require("../controllers/courseController")
const feeController = require("../controllers/feeController")
const noticesController = require("../controllers/noticesController")
const teacherController = require("../controllers/teacherController")
const userController = require("../controllers/userController")
const verifyJWT = require("../middleware/verifyJWT");
const verifyRoles = require("../middleware/verifyRole");

router.use(verifyJWT);
router.use(verifyRoles(process.env.ADMIN));
router.route("/advertisements")
    .get(advertisementsController.getAll)
    .post(advertisementsController.postAdvertisement)
    .delete(advertisementsController.deleteAdvertisement)
router.route("/class")
    .get(classController.getClass)
    .post(classController.addClass)
router.route("/course")
    .get(courseController.getAllCourses)
    .post(courseController.addCourse)
router.route("/course/coursemap")
    .post(courseController.addClassCourseMap)
    .delete(courseController.removeClassCourseMap)
router.route("/fee")
    .get(feeController.getAllFee)
    .post(feeController.addFeeByClass)
router.route("/fee/mark")
    .put(feeController.markFee)
router.route("/notices")
    .get(noticesController.getAll)
    .post(noticesController.postNotice)
    .delete(noticesController.deleteNotice)
router.route("/teacher")
    .get(teacherController.getTeachers)
router.route("/teacher/verifiedByAdmin")
    .put(teacherController.confirmedByTeacher)
router.route("/teacher/verifiedByTeacher")
    .put(teacherController.verifyTeacher)
router.route("/user")
    .get(userController.getStudents)

module.exports = router;