const db = require("../config/dbConn");
const { uploadSingleFile, deleteFile } = require("../config/driveConn");
const fs = require("fs");
const path = require("path");

const addAssignment = async (req, res) => {
  const { email } = req;
  const { course_id, created_date, submission_date, topic } = req?.body;
  // console.log(req.body);
  if (!course_id || !created_date || !submission_date || !topic)
    return res.status(400).json({ message: "Data missing" });
  try {
    const data = await db.query(
      "SELECT teacher.email from teacher join course on course.teacher_id=teacher.id where course.id=$1",
      [course_id]
    );
    if (data.rowCount === 0 || data.rows[0].email !== email)
      return res.status(401).json({ message: "Unauthorized" });
  } catch (err) {
    console.log(err);

    return res.status(500).json({ message: "Error posting assignment" });
  }
  try {
    const { file } = req;
    // console.log("hiiiii",file);
    if (file) {
      const url = await uploadSingleFile(
        file.originalname,
        path.join(__dirname, "..", file.path),
        process.env.DRIVE_NOTICE_FOLDER,
        file.mimetype
      );
      // console.log("url : ", url);
      //  TO DO ANY TEACHER CAN MODIFY ANY ASS
      const data = await db.query(
        "INSERT INTO ASSIGNMENT(course_id,created_date,submission_date,topic,url) VALUES($1, $2, $3,$4,$5) RETURNING *",
        [
          course_id,
          new Date(created_date).toISOString(),
          new Date(submission_date).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            timeZoneName: "short",
          }),
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
      // console.log(data.rows);
      return res
        .status(200)
        .json({ message: "Assignment posted successfully" });
    } else {
      res.status(400).json({ message: "Assignment requires file" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error posting assignment" });
  }
};

const removeAssignment = async (req, res) => {
  const { email } = req;
  const id = req?.body?.id || 1;
  if (!id) return res.status(400).json({ message: "Deletion id required" });
  try {
    const getAssign = await db.query(
      "SELECT course_id from ASSIGNMENT WHERE id=$1",
      [id]
    );
    if (getAssign.rowCount == 0)
      return res.status(404).json({ message: "No such file present" });
    const data = await db.query(
      "SELECT teacher.email from teacher join course on course.teacher_id=teacher.id where course.id=$1",
      [getAssign.rows[0].course_id]
    );
    if (data.rowCount === 0 || data.rows[0].email !== email)
      return res.status(401).json({ message: "Unauthorized" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error deleting assignment" });
  }
  try {
    const data = await db.query(
      "DELETE FROM ASSIGNMENT WHERE id=$1 RETURNING *",
      [id]
    );
    // console.log(data);
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
  const { email } = req;
  const { course_id, description, topic, videoId } = req.body;
  if (!course_id || !description || !topic || !videoId)
    return res.status(400).json({ message: "Data Missing" });
  try {
    const data = await db.query(
      "SELECT teacher.email from teacher join course on course.teacher_id=teacher.id where course.id=$1",
      [course_id]
    );
    if (data.rowCount === 0 || data.rows[0].email !== email)
      return res.status(401).json({ message: "Unauthorized" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error posting assignment" });
  }
  try {
    const data = await db.query(
      "INSERT INTO LECTURE(course_id,description,topic,url) VALUES($1,$2,$3,$4) RETURNING *",
      [course_id, description, topic, videoId]
    );
    // console.log(data.rows);
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
    await db.query("BEGIN");
    var errStack = [];
    for (var i = 0; i < data.length; i++) {
      try {
        const response = await db.query(
          "INSERT INTO SCORECARD(course_id,credit,marks_obtained,marks_total,minor,pass,sem_no,student_roll) values($1,$2,$3,$4,$5,$6,$7,$8)",
          [
            data[i]["course_id"],
            data[i]["credit"],
            data[i]["marks_obtained"],
            data[i]["marks_total"],
            data[i]["minor"],
            data[i]["pass"],
            data[i]["sem_no"],
            data[i]["student_roll"],
          ]
        );
        // console.log(response);
      } catch (err) {
        console.log(err);
        errStack.push(err);
      }
    }
    await db.query("COMMIT");
    return res.json({
      message: "Data successsfully added",
      errorStack: errStack,
    });
  } catch (err) {
    console.log(err);
    await db.query("ROLLBACK");
    return res.status(500).json({ message: "Some error occured" });
  }
};
const modifyMarks = async (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ message: "Data Missing" });
  try {
    await db.query("BEGIN");
    var errStack = [];
    for (var i = 0; i < data.length; i++) {
      try {
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
        // console.log(data[i]);
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
        if (response.rowCount === 0) {
          errStack.push(data[i]);
        }
      } catch (err) {
        console.log("err", err);
        errStack.push(err);
      }
    }
    await db.query("COMMIT");
    return res.json({
      message: "Data successfully updated",
      errorStack: errStack,
    });
  } catch (err) {
    console.log(err);
    await db.query("ROLLBACK");
    return res.status(500).json({ message: "Some error occurred" });
  }
};

const deleteMarks = async (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ message: "Data Missing" });
  try {
    await db.query("BEGIN");
    var errStack = [];
    for (var i = 0; i < data.length; i++) {
      try {
        const { course_id, sem_no, student_roll } = data[i];
        const response = await db.query(
          "DELETE FROM SCORECARD WHERE student_roll = $1 AND course_id = $2 AND sem_no = $3",
          [student_roll, course_id, sem_no]
        );
        // console.log(response);
      } catch (err) {
        console.log(err);
        errStack.push(err);
      }
    }
    await db.query("COMMIT");
    return res.json({
      message: "Data successfully deleted",
      errorStack: errStack,
    });
  } catch (err) {
    console.log(err);
    await db.query("ROLLBACK");
    return res.status(500).json({ message: "Some error occurred" });
  }
};

const getStudentsByCourse = async (req, res) => {
  const { course_id } = req.query;
  // console.log(course_id);
  if (!course_id) return res.status(400).json({ message: "Id required" });
  try {
    const data = await db.query(
      "SELECT student.id,student.roll,student.email,student.name,class.name as class FROM STUDENT JOIN COURSE_CLASS_MAP ON student.class_id=course_class_map.class_id JOIN CLASS on class.id=student.class_id where course_class_map.course_id=$1",
      [course_id]
    );
    // console.log(data.rows);
    const data1 = await db.query(
      "SELECT student.id,student.roll,student.email,student.name FROM minor_elective JOIN student on student.roll=minor_elective.student_roll where minor_elective.course_id=$1",
      [course_id]
    );

    return res.json([...data.rows, ...data1.rows]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Some error occurred" });
  }
};

// Verify to do
const getLecturesByCourse = async (req, res) => {
  const { role, email } = req;
  const { course_id } = req.query;
  if (role === process.env.USER) {
    try {
      const data = await db.query(
        "SELECT course.id from (course_class_map JOIN student on student.class_id=course_class_map.class_id ) JOIN course on course.id=course_class_map.course_id where student.email=$1",
        [email]
      );
      const data1 = await db.query(
        "SELECT course.id from (minor_elective JOIN student on minor_elective.student_roll=student.roll) JOIN course on minor_elective.course_id=course.id where student.email=$1",
        [email]
      );
      const x = [...data.rows, ...data1.rows];
      const filtered = x.filter((e) => e.id == course_id);
      if (filtered.length === 0)
        return res.status(401).json({ message: "Unauthorized" });
    } catch (err) {
      return res.status(500).json({ message: "Some error occurred" });
    }
  }
  if (!course_id) return res.status(400).json({ message: "Data Required" });
  try {
    const data = await db.query("SELECT * FROM LECTURE WHERE course_id=$1", [
      course_id,
    ]);
    // console.log(data.rows);
    return res.json(data.rows);
  } catch (err) {
    return res.status(500).json({ message: "Some error occurred" });
  }
};

const getAssignmentsByCourse = async (req, res) => {
  const { role, email } = req;
  const { course_id } = req.query;
  // console.log("hefhjjujurfj")
  if (role === process.env.USER) {
    // console.log("hefhjjujurfjhjufrujfr")
    try {
      const data = await db.query(
        "SELECT course.id from (course_class_map JOIN student on student.class_id=course_class_map.class_id ) JOIN course on course.id=course_class_map.course_id where student.email=$1",
        [email]
      );
      // console.log("hefhjjujurfjchjfjfcfij")
      const data1 = await db.query(
        "SELECT course.id from (minor_elective JOIN student on minor_elective.student_roll=student.roll) JOIN course on minor_elective.course_id=course.id where student.email=$1",
        [email]
      );
      const x = [...data.rows, ...data1.rows];
      // console.log("x is: ",x);
      const filtered = x.filter((e) => e.id == course_id);
      if (filtered.length === 0)
        return res.status(401).json({ message: "Unauthorized" });
    } catch (err) {
      return res.status(500).json({ message: "Some error occurred" });
    }
  }
  if (!course_id) return res.status(400).json({ message: "Id required" });
  try {
    const data = await db.query("SELECT * FROM ASSIGNMENT where course_id=$1", [
      course_id,
    ]);
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
