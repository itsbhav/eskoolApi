const db = require("../config/dbConn");
const { uploadSingleFile, deleteFile } = require("../config/driveConn");
const fs = require("fs");

const addAssignment = async (req, res) => {
  const { course_id, created_date, submission_date, topic } = req?.body;
  if (!course_id || !created_date || !submission_date || !topic)
    return res.status(400).json({ message: "Data missing" });
  try {
    const { file } = req;
    if (file) {

      const url = await uploadSingleFile(
        file.originalname,
        path.join(__dirname, "..", file.path),
        process.env.DRIVE_NOTICE_FOLDER,
        file.mimetype
      );

      const data = await db.query(
        "INSERT INTO ASSIGNMENT(course_id,created_date,submission_date,topic,url) VALUES($1, $2, $3,$4,$5) RETURNING *",
        [
          course_id,
          new Date(created_date).toISOString(),
          new Date(submission_date).toISOString(),
          topic,
          url,
        ]
      );

      fs.unlink(path.join(__dirname, "..", file.path), (err) => {
        if (err) {
          console.error("Error deleting file:", err);
          return;
        }
      });
      console.log(data.rows)
      return res
        .status(200)
        .json({ message: "Assignment posted successfully"});
    } else {
      res.status(400).json({ message: "Assignment requires file" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error posting assignment" });
  }
};

const removeAssignment = async (req, res) => {
  const id = req?.body?.id || 1;
  if (!id) return res.status(400).json({ message: "Deletion id required" });
  try {
    const data = await db.query(
      "DELETE FROM ASSIGNMENT WHERE id=$1 RETURNING *",
      [id]
    );
    console.log(data);
    try {
      const fileIdRegex = /\/d\/(.+?)\//; // Regular expression to extract the file ID
      const match = data.rows[0].url.match(fileIdRegex);
      const fileId = match ? match[1] : null;
      await deleteFile(fileId);
    } catch (err) {
      console.log(err);
    }
    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error Deleting ASSIGNMENT" });
  }
};

const addLecture = async (req, res) => {
  const { course_id, description, topic, videoId } = req.body;
  if (!course_id || !description || !topic || !videoId)
    return res.status(400).json({ message: "Data Missing" });
  try {
    const data = await db.query(
      "INSERT INTO LECTURE(course_id,description,topic,url) VALUES($1,$2,$3,$4) RETURNING *",
      [course_id, description, topic, videoId]
    );
    console.log(data.rows);
    return res.json({ message: "Data Added successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Some error occured" });
  }
};

const addMarks = async (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ message: "Data Missing" });
  try {
    const totalSize = Object.keys(data[0]).length * data.length;
    console.log(totalSize, data.length);
    var full = "";
    for (var i = 1; i <= totalSize; ) {
      var s = "(";
      for (var j = 0; j < Object.keys(data[0]).length; j++) {
        s += "$" + `${i++},`;
      }
      s += "),";
      full += s;
    }
    full = full.substring(0, full.length - 1);
    var arr = [];
    for (var i = 0; i < data.length; i++) {
      arr.push(data[i]["course_id"]);
      arr.push(data[i]["credit"]);
      arr.push(data[i]["marks_obtained"]);
      arr.push(data[i]["marks_total"]);
      arr.push(data[i]["minor"]);
      arr.push(data[i]["pass"]);
      arr.push(data[i]["sem_no"]);
      arr.push(data[i]["student_roll"]);
    }
    const response = await db.query(
      `INSERT INTO SCORECARD(course_id,credit,marks_obtained,marks_total,minor,pass,sem_no,student_roll) values${full}` ,
      arr
    );
    console.log(response);
    return res.json({ message: "Data successsfully added" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Some error occured" });
  }
};
const modifyMarks = async (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ message: "Data Missing" });
  try {
    for (var i = 0; i < data.length; i++) {
      const {
        course_id,
        credit,
        marks_obtained,
        marks_total,
        minor,
        pass,
        sem_no,
        student_roll,
      } = data[i];
      const response = await db.query(
        "UPDATE SCORECARD SET credit = $1, marks_obtained = $2, marks_total = $3, minor = $4, pass = $5 WHERE (student_roll = $6 AND course_id = $7 AND sem_no = $8 )",
        [
          credit,
          marks_obtained,
          marks_total,
          minor,
          pass,
          student_roll,
          course_id,
          sem_no,
        ]
      );
      console.log(response);
    }
    return res.json({ message: "Data successfully updated" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Some error occurred" });
  }
};

const deleteMarks = async (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ message: "Data Missing" });
  try {
    for (var i = 0; i < data.length; i++) {
      const { course_id, sem_no, student_roll } = data[i];
      const response = await db.query(
        "DELETE FROM SCORECARD WHERE student_roll = $1 AND course_id = $2 AND sem_no = $3",
        [student_roll, course_id, sem_no]
      );
      console.log(response);
    }
    return res.json({ message: "Data successfully deleted" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Some error occurred" });
  }
};

const getStudentsByCourse = async (req, res) => {
  const { course_id } = req.query;
  if (!course_id) return res.status(400).json({ message: "Id required" });
  try {
    const data = await db.query(
      "SELECT student.id,student.roll,student.email,student.name FROM STUDENT JOIN COURSE_CLASS_MAP ON student.class_id=course_class_map.class_id where course_class_map.course_id=$1",
      [course_id]
    );
    console.log(data.rows);
    const data1 = await db.query(
      "SELECT student.id,student.roll,student.email,student.name FROM minor_elective JOIN student on student.roll=minor_elective.student_roll where minor_elective.course_id=$1",
      [course_id]
    );
    return res.json([...data.rows, ...data1.rows] );
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Some error occurred" });
  }
};

const getLecturesByCourse =async (req, res) => {
  const { course_id } = req.query;
  if (!course_id) return res.status(400).json({ message: "Data Required" });
  try {
    const data = await db.query("SELECT * FROM LECTURE WHERE course_id=$1", [course_id]);
    console.log(data.rows);
    return res.json(data.rows);
  } catch (err) {
    return res.status(500).json({ message: "Some error occurred" });
  }
};

const getAssignmentsByCourse = async(req, res) => {
  const { course_id } = req.query;
  if (!course_id) return res.status(400).json({ message: "Id required" });
  try { 
    const data = await db.query("SELECT * FROM ASSIGNMENT where course_id=$1", [course_id]);
    return res.json(data.rows);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Some error occurred" });
  }
};

module.exports = {
  addLecture,
  addAssignment,
  removeAssignment,
  addMarks,
  modifyMarks,
  deleteMarks,
  getLecturesByCourse,
  getStudentsByCourse,
  getAssignmentsByCourse,
};
