const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/dbConn");
// @desc Login
// @route POST /auth
// @access Public
const login = async (req, res) => {
  const { email, password, persist, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    var roleStr = "";
    if (role === process.env.ADMIN) roleStr = "ADMIN";
    else if (role === process.env.USER) roleStr = "STUDENT";
    else if (role === process.env.TEACHER) roleStr = "TEACHER";
    const foundUser = await db.query(
      `SELECT * from ${roleStr} where email=$1`,
      [email]
    );
    if (!foundUser.rowCount === 0)
      return res.status(404).json({ message: "No User exist" });
    // console.log(foundUser.rows[0]);
    const match = await bcrypt.compare(password, foundUser.rows[0].password);
    if (!match) return res.status(401).json({ message: "Unauthorized" });
    const accessToken = jwt.sign(
      {
        UserInfo: {
          useremail: foundUser.rows[0].email,
          userrole: role,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      {
        UserInfo: {
          useremail: foundUser.rows[0].email,
          userrole: role,
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
    return res.json({ accessToken });
  } catch (err) {
    return res.status(500).json({ message: "Some error occured" });
  }
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });
  try {
    const refreshToken = cookies.jwt;

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) return res.status(403).json({ message: "Forbidden" });
        var roleStr = "";
        if (decoded.UserInfo.userrole === process.env.ADMIN) roleStr = "ADMIN";
        else if (decoded.UserInfo.userrole === process.env.USER)
          roleStr = "STUDENT";
        else if (decoded.UserInfo.userrole === process.env.TEACHER)
          roleStr = "TEACHER";
        // console.log(decoded.UserInfo.useremail, roleStr);
        const foundUser = await db.query(
          `SELECT id,email from ${roleStr} where email=$1`,
          [decoded.UserInfo.useremail]
        );
        if (foundUser.rowCount === 0)
          return res.status(401).json({ message: "Unauthorized" });
        // console.log(foundUser.rows[0]);
        const accessToken = jwt.sign(
          {
            UserInfo: {
              useremail: foundUser.rows[0].email,
              userrole: decoded.UserInfo.userrole,
            },
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );

        return res.json({ accessToken });
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Some Error Occured" });
  }
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
    partitioned: true,
  });
  res.clearCookie("auth2", {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross-site cookie
    maxAge: 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
    partitioned: true,
  });
  res.json({ message: "Cookie cleared" });
};

module.exports = {
  login,
  refresh,
  logout,
};
