const db = require("../config/dbConn");
const bcrypt = require("bcrypt");
const verifier = require("../utility/verifyEmail");
const jwt = require("jsonwebtoken");

// Get Students
const getStudents = async (req, res) => {
  try {
    const data = await db.query(
      "SELECT id,email,email_verified,name,roll from STUDENT"
    );
    if (data.rowCount === 0)
      return res.status(404).json({ message: "No Students exist" });
    // console.log(data.rows);
    return res.json(data.rows);
  } catch (err) {
    return res.status(500).json({ message: "Some error occured" });
  }
};

// CREATE STUDENT ACCOUNT
const createStudent = async (req, res) => {
  const { class_id, email, inhouse, name, pass, persist } = req.body;
  if (
    !email ||
    !name ||
    !pass ||
    !class_id ||
    typeof inhouse !== "boolean" ||
    typeof persist !== "boolean"
  ) {
    return res.status(400).json({ message: "Required fields missing" });
  }
  try {
    // console.log("hii")
    const rollNumber = await db.query("SELECT nextval($1)", [
      inhouse ? "inhouse_roll" : "outhouse_roll",
    ]);
    const roll =
      new Date().getFullYear().toString() +
      (inhouse ? "IN" : "OU") +
      rollNumber.rows[0].nextval;
    const passw = await bcrypt.hash(pass, 10);
    const data = await db.query(
      "INSERT INTO STUDENT(class_id,email,inhouse,name,password,roll) VALUES($1,$2,$3,$4,$5,$6)",
      [class_id, email, inhouse, name, passw, roll]
    );
    const accessToken = jwt.sign(
      {
        UserInfo: {
          useremail: email,
          userrole: process.env.USER,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      {
        UserInfo: {
          useremail: email,
          userrole: process.env.USER,
        },
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    // Create secure cookie with refresh token
    if (persist === true) {
      res.cookie("jwt", refreshToken, {
        httpOnly: true, //accessible only by web server
        secure: true, //https
        sameSite: "None", //cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
        partitioned: true,
      });
    } else {
      res.cookie("jwt", refreshToken, {
        httpOnly: true, //accessible only by web server
        secure: true, //https
        sameSite: "None", //cross-site cookie
        expires: 0, //cookie expiry: set to match rT
        partitioned: true,
      });
    }
    await verifier.mail(email, name, "STUDENT");
    return res.json({ accessToken });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: "Some Conflict Occured" });
  }
};

const getUserById = async (req, res) => {
  const { email } = req;
  try {
    const data = await db.query(
      "SELECT id,email,email_verified,name,roll from STUDENT where email=$1",
      [email]
    );
    if (data.rowCount === 0)
      return res.status(404).json({ message: "No such user exist" });
    // console.log(data.rows[0]);
    return res.json(data.rows);
  } catch (err) {
    res.status(500).json({ message: "Some error occured" });
  }
};

module.exports = {
  createStudent,
  getStudents,
  getUserById,
};
