const nodemailer = require("nodemailer");
const db = require("../config/dbConn");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.OFFICIAL_MAIL,
    pass: process.env.PASS,
  },
});

const mail = async (email, name, role) => {
  try {
    const token = crypto.randomBytes(48).toString("hex");
    const domain = `http://localhost:3500/verify?token=${token}`;
    const info = await transporter.sendMail({
      from: process.env.OFFICIAL_MAIL, // sender address
      to: email, // list of receivers
      subject: "Verify Your Mail", // Subject line
      html: `<div><b>Hi ${name}</b>, Greetings from eSkool.</div>
          <div>Click the link to verify your mail, <a href=${domain}>${domain}</a></div>
          `,
    });
    const data = await db.query(
      `INSERT INTO email_verify(email,role,token) values($1,$2,$3)`,
      [email, role, token]
    );
  } catch (err) {
    console.log(err?.message);
  }
};

const verifyMail = async (req, res) => {
  const { token } = req?.query;
  if (!token || !token?.length)
    return res.status(403).json({ message: "Unauthorized" });
  try {
    const data = await db.query(
      "DELETE from email_verify where token=$1 RETURNING *",
      [token]
    );
    if (data.rowCount === 0)
      return res.status(404).json({ message: "Token invalid" });
    if (data.rows[0].role !== "TEACHER" && data.rows[0].role !== "STUDENT")
      return res.status(404).json({ message: "Some error occured" });
    const data1 = await db.query(
      `UPDATE ${data.rows[0].role} SET email_verified=true`
    );
    const info = await transporter.sendMail({
      from: process.env.OFFICIAL_MAIL, // sender address
      to: data.rows[0].email, // list of receivers
      subject: "Email Verified", // Subject line
      html: `<h1>Your mail has been Verified Successfully.</h1>
          `,
    });
    return res.redirect("http://localhost:3000");
  } catch (err) {
    console.log(err?.message);
    return res
      .status(500)
      .json({ message: `Some error occured,${err?.message}` });
  }
};

const passMail = async (req, res) => {
  const { email, role } = req?.body;
  if (!email || !role) return res.status(400).json({ message: "Data missing" });
  try {
    var str = "";
    if (role === process.env.USER) str = "STUDENT";
    else if (role === process.env.TEACHER) str = "TEACHER";
    const data = await db.query(`SELECT id,name from ${str} where email=$1`, [
      email,
    ]);
    if (data.rowCount === 0)
      return res.status(404).json({ message: "No such account exist" });
    const token = crypto.randomBytes(48).toString("hex");
    const domain = `http://localhost:3500/secure?token=${token}`;
    const info = await transporter.sendMail({
      from: process.env.OFFICIAL_MAIL, // sender address
      to: email, // list of receivers
      subject: `Change your password`, // Subject line
      html: `<div><b>Hi ${data.rows[0].name}</b>, Greetings from eSkool.</div>
          <div>Click the link to change your password, <a href=${domain}>${domain}</a></div>
          <div>If you are not an intended person, please inform us at ${process.env.OFFICIAL_MAIL}</div>
          `,
    });
    const data1 = await db.query(
      `INSERT INTO email_verify(email,role,token) values($1,$2,$3)`,
      [email, role, token]
    );
  } catch (err) {
    console.log(err?.message);
    return res
      .status(400)
      .json({ message: `Some error occured ${err?.message}` });
  }
  return res.status(200).json({ message: "mail sent" });
};

const verifyPassMail = async (req, res) => {
  const { token } = req?.query;
  if (!token || !token?.length)
    return res.status(403).json({ message: "Unauthorized" });
  try {
    const data = await db.query(
      "DELETE from email_verify where token=$1 RETURNING *",
      [token]
    );
    if (data.rowCount === 0)
      return res.status(404).json({ message: "Token invalid" });
    return res
      .status(200)
      .render("change", { email: data.rows[0].email, role: data.rows[0].role });
  } catch (err) {
    console.log(err?.message);
    return res
      .status(500)
      .json({ message: `Some error occured,${err?.message}` });
  }
};

const verificationSuccess = async (req, res) => {
  const { password, email, role } = req?.body;
  if (!password || !email || !role)
    return res
      .status(403)
      .json({ message: "Unauthorized, all data required." });
  try {
    if (role !== "STUDENT" && role !== "TEACHER")
      return res
        .status(403)
        .json({ message: "Unauthorized, all data required." });
    const hashedPwd = await bcrypt.hash(password, 10);
    const data = await db.query(
      `UPDATE ${role} SET password=$1 where email=$2`,
      [hashedPwd, email]
      );
       const info = await transporter.sendMail({
      from: process.env.OFFICIAL_MAIL, // sender address
      to: email, // list of receivers
      subject: "Pass Changed Success", // Subject line
      html: `<h1>Your pass changed Successfully.</h1>
          `,
    });
    return res.status(200).send("Password changed successfully.");
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Some unexpected error occured, please try again." });
  }
};
module.exports = {
  mail,
  verifyMail,
  passMail,
  verifyPassMail,
  verificationSuccess,
};
