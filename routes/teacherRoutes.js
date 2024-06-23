const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const lectureController = require("../controllers/lectureController");
const teacherController = require("../controllers/teacherController");
const verifyJWT = require("../middleware/verifyJWT");
const verifyRoles = require("../middleware/verifyRole");
const youtubeConn = require("../config/youtubeConn");
const { upload } = require("../config/multer");

router.route("/").post(teacherController.createTeacher);
router.use(verifyJWT);
router.use(verifyRoles(process.env.TEACHER));
router.route("/").get(teacherController.getTeacherById);
router.route("/course").get(courseController.getCoursesByTeacherId);
router
  .route("/lecture")
  .get(lectureController.getLecturesByCourse)
  .post(lectureController.addLecture);
router
  .route("/assignment")
  .get(lectureController.getAssignmentsByCourse)
  .post(upload.single("myFile"), lectureController.addAssignment)
  .delete(lectureController.removeAssignment);
router.route("/addtoplay").post(youtubeConn.addToPlaylist);
router.route("/upload").post(youtubeConn.uploadVideo);
router.route("/student").get(lectureController.getStudentsByCourse);
module.exports = router;
