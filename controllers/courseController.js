const db = require("../config/dbConn");
const addCourse = async (req, res) => {
  const {
    description,
    name,
    prerequisites,
    syllabus,
    teacher_id,
    playlist,
    whatsapp,
  } = req.body;
  if (
    !description ||
    !name ||
    !prerequisites ||
    !syllabus ||
    !teacher_id ||
    !playlist
  ) {
    return res.status(400).json({ message: "Data Missing" });
  }
  try {
    const data = await db.query(
      "INSERT INTO COURSE(description,name,prerequisites,syllabus, teacher_id, playlist, whatsapp) values($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [
        description,
        name,
        prerequisites,
        syllabus,
        teacher_id,
        playlist,
        whatsapp || "",
      ]
    );
    // console.log(data);
    return res.json(data.rows);
  } catch (err) {
    return res.status(500).json({ message: "Some error occured" });
  }
};

const getCoursesByUserId = async (req, res) => {
  const { email } = req;
  if (!email) return res.status(401).json({ message: "User Unauthorized" });
  try {
    const data = await db.query(
      "SELECT course.id,course.name,course.teacher_id, course.playlist,course.whatsapp from (course_class_map JOIN student on student.class_id=course_class_map.class_id ) JOIN course on course.id=course_class_map.course_id where student.email=$1",
      [email]
    );
    const data1 = await db.query(
      "SELECT course.id,course.name,course.teacher_id,minor_elective.minor,course.playlist,course.whatsapp from (minor_elective JOIN student on minor_elective.student_roll=student.roll) JOIN course on minor_elective.course_id=course.id where student.email=$1 and minor_elective.completed=false",
      [email]
    );
    // console.log([...data.rows,...data1.rows]);
    return res.status(200).json([...data.rows, ...data1.rows]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Some error occured" });
  }
};
const getCoursesByTeacherId = async (req, res) => {
  const { email } = req;
  if (!email) return res.status(400).json({ message: "Unauthorized" });
  try {
    const data = await db.query(
      "SELECT course.id,course.name,course.playlist,course.whatsapp from course JOIN teacher on course.teacher_id=teacher.id where teacher.email=$1",
      [email]
    );
    // console.log(data)
    return res.json(data.rows);
  } catch (err) {
    return res.status(500).json({ message: "Some error occured" });
  }
};
const addClassCourseMap = async (req, res) => {
  const { class_id, course_id } = req.body;
  try {
    const data = await db.query(
      "INSERT INTO COURSE_CLASS_MAP(class_id,course_id) VALUES($1,$2)",
      [class_id, course_id]
    );
  } catch (err) {
    return res.status(500).json({ message: "Some error occured" });
  }
  return res.json({ message: "Data added successfully" });
};
const removeClassCourseMap = async (req, res) => {
  const { class_id, course_id } = req.body;
  try {
    const data = await db.query(
      "DELETE FROM COURSE_CLASS_MAP where class_id=$1 and course_id=$2 RETURNING *",
      [class_id, course_id]
    );
    if (data.rowCount === 0) {
      return res.status(404).json({ message: "No data found to delete" });
    }
    return res.json({
      message: "Data removed successfully",
      deletedCount: data.rowCount,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const data = await db.query(
      "SELECT course.description,course.name,course.id,course.syllabus,course.prerequisites,course.teacher_id,teacher.email FROM COURSE JOIN TEACHER ON teacher.id=course.teacher_id"
    );
    return res.json(data.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

const enrollCourseAsMinor = async (req, res) => {
  const { email } = req;
  const { course_id, minor, student_roll } = req.body;
  if (!email || !course_id || typeof minor != "boolean" || !student_roll)
    return res.status(400).json({ message: "Additional Data needed" });
  try {
    const data = await db.query(
      "SELECT course_class_map.course_id from course_class_map JOIN student on student.class_id=course_class_map.class_id where course_class_map.course_id=$1",
      [course_id]
    );
    if (data.rowCount > 0) {
      return res
        .status(401)
        .json({ message: "You are already enrolled as major" });
    } else {
      const data1 = await db.query(
        "INSERT INTO minor_elective(course_id,minor,student_roll) VALUES($1,$2,$3)",
        [course_id, minor, student_roll]
      );
    }
    return res.json({ message: "Course Enrolled Successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Some Server Side Error" });
  }
};

module.exports = {
  addClassCourseMap,
  addCourse,
  getAllCourses,
  getCoursesByTeacherId,
  getCoursesByUserId,
  removeClassCourseMap,
  enrollCourseAsMinor,
};
