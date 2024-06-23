const db = require("../config/dbConn");
const addFeeByClass = async (req, res) => {
  const { class_id, amount } = req.body;
  if (!class_id || !amount)
    return res.status(400).json({ message: "data missing" });

  try {
    const students = await db.query(
      "SELECT roll FROM STUDENT WHERE class_id = $1",
      [class_id]
    );
    for (let student of students.rows) {
      await db.query("INSERT INTO FEE (roll, amount) VALUES ($1, $2)", [
        student.roll,
        amount,
      ]);
    }
    // console.log(students.rows)
    return res
      .status(200)
      .json({
        message: "Fee added successfully to all students in the class.",
      });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "An error occurred while adding the fee." });
  }
};

const markFee = async (req, res) => {
  const { id, paid } = req.body;
  if (!id || typeof paid != "boolean")
    return res.status(400).json({ message: "Data Missing" });
  try {
    const data = await db.query("UPDATE FEE SET paid=$1 where id=$2", [
      paid,
      id,
    ]);
    return res.json({ message: "Updated successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Some error occured" });
  }
};

const getYourFee = async (req, res) => {
  const { email } = req;
  if (!email) return res.status(400).json({ message: "Email Missing" });

  try {
    const result = await db.query(
      "SELECT fee.* FROM fee JOIN student ON fee.roll = student.roll WHERE student.email = $1",
      [email]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No fee records found for this student" });
    }

    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Some error occurred" });
  }
};

const getAllFee = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM fee ORDER BY roll");
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Some error occurred" });
  }
};

const getYourMarks = async (req, res) => {
  const { email } = req;
  if (!email) return res.status(400).json({ message: "Email Missing" });

  try {
    const result = await db.query(
      "SELECT scorecard.*, course.name FROM student JOIN scorecard ON student.roll = scorecard.student_roll JOIN course ON scorecard.course_id = course.id WHERE student.email = $1",
      [email]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No score records found for this student" });
    }

    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Some error occurred" });
  }
};

module.exports = {
  addFeeByClass,
  markFee,
  getYourFee,
  getYourMarks,
  getAllFee,
};
