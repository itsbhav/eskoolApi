const db = require("../config/dbConn");
const bcrypt = require("bcrypt");
const verifier = require("../utility/verifyEmail");
const jwt = require("jsonwebtoken");

// CONFIRMED BY TEACHER
const confirmedByTeacher = async (req, res) => {
  const { verified_by_admin, email } = req.body;
  if (typeof verified_by_admin !== "boolean" || !email)
    return res.status(400).json({ message: "Did not get expected data" });
  try {
    const data = await db.query(
      "UPDATE TEACHER SET verified_by_admin=$1 where email=$2 RETURNING id ",
      [verified_by_admin, email]
    );
    if (data.rowCount === 0)
      return res.status(404).json({ message: "No such user exist" });
    return res.status(201).json({
      message: verified_by_admin
        ? "Verified successfully"
        : "Unverified successfully, please remove access of uploads also from youtube",
    });
  } catch (err) {
    return res.status(500).json({ message: "Some error occured" });
  }
};

// Get Verified and Unverified Teachers
const getTeachers = async (req, res) => {
  try {
    const data = await db.query(
      "SELECT id,email,email_verified,institution,name,verified_by_admin,verified_by_teacher from TEACHER"
    );
    if (data.rowCount === 0)
      return res.ststus(404).json({ message: "No teachers exist" });
    // console.log(data);
    return res.json(data.rows);
  } catch (err) {
    return res.status(500).json({ message: "Some error occured" });
  }
};

// const getTeacherByTId = async (req, res) => {
//   const { id } = req.query;
//   try {
//     const data = db.query("SELECT name,email from teacher where id=$1", id);
//     if(data.rowCount===0)return res.status(404).json({message:"No such teacher exist"})
//     return res.json(data.rows[0]);
//   } catch (err) {
//     return res.status(500).json({message:"Error"})
//   }
// }

// VERIFY A TEACHER
const verifyTeacher = async (req, res) => {
  const { verified_by_teacher, email } = req.body;
  if (typeof verified_by_teacher !== "boolean" || !email)
    return res.status(400).json({ message: "Did not get expected data" });
  try {
    const data = await db.query(
      "UPDATE TEACHER SET verified_by_teacher=$1 where email=$2 RETURNING id ",
      [verified_by_teacher, email]
    );
    if (data.rowCount === 0)
      return res.status(404).json({ message: "No such user exist" });
    return res.status(201).json({
      message: verified_by_teacher
        ? "Verified successfully"
        : "Unverified successfully, please remove access of uploads also from youtube",
    });
  } catch (err) {
    return res.status(500).json({ message: "Some error occured" });
  }
};

// CREATE TEACHER ACCOUNT
const createTeacher = async (req, res) => {
  const { email, institution, name, pass} = req.body;
  if (!email || !name || !pass) {
    return res.status(400).json({ message: "Required fields missing" });
  }
  try {
    var ins = !institution ? "" : institution;
    try {
      const passw = await bcrypt.hash(pass, 10);
      const data = await db.query(
        "INSERT INTO TEACHER(email,institution,name,password) VALUES($1,$2,$3,$4)",
        [email, ins, name, passw]
      );
      // const accessToken = jwt.sign(
      //   {
      //     UserInfo: {
      //       useremail: email,
      //       userrole: process.env.TEACHER,
      //     },
      //   },
      //   process.env.ACCESS_TOKEN_SECRET,
      //   { expiresIn: "15m" }
      // );
      // const refreshToken = jwt.sign(
      //   {
      //     UserInfo: {
      //       useremail: email,
      //       userrole: process.env.TEACHER,
      //     },
      //   },
      //   process.env.REFRESH_TOKEN_SECRET,
      //   { expiresIn: "7d" }
      // );
      // // Create secure cookie with refresh token
      // if (persist === true) {
      //   res.cookie("jwt", refreshToken, {
      //     httpOnly: true, //accessible only by web server
      //     secure: true, //https
      //     sameSite: "None", //cross-site cookie
      //     maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
      //     partitioned: true,
      //   });
      // } else {
      //   res.cookie("jwt", refreshToken, {
      //     httpOnly: true, //accessible only by web server
      //     secure: true, //https
      //     sameSite: "None", //cross-site cookie
      //     expires: 0, //cookie expiry: set to match rT
      //     partitioned: true,
      //   });
      // }
      await verifier.mail(email, name, "TEACHER");
      return res.json({ message:"Teacher "+ name +" with mail "+ email +" added successfully, please verify your email using mail received and login." });
    } catch (err) {
      return res.status(401).json({ message: "Some Conflict Occured" });
    }
  } catch (err) {
    return res.status(400).json({ message: "Some error occured" });
  }
};

const getTeacherById = async (req, res) => {
  const { email } = req;
  try {
    const data = await db.query(
      "SELECT id,email,email_verified,institution,name,verified_by_admin,verified_by_teacher from TEACHER where email=$1",
      [email]
    );
    if (data.rowCount === 0)
      return res.status(404).json({ message: "No such teacher exist" });
    // console.log(data.rows[0]);
    return res.json(data.rows);
  } catch (err) {
    res.status(500).json({ message: "Some error occured" });
  }
};

module.exports = {
  createTeacher,
  verifyTeacher,
  confirmedByTeacher,
  getTeachers,
  getTeacherById,
  // getTeacherByTId
};
