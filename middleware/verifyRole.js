const db = require("../config/dbConn");
// CHECK FOR ROLES
const verifyRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req?.role) return res.status(401).json({ message: "Not Allowed" }); //No Roles available
    const allowedArraySearch = [...allowedRoles];
    // console.log(allowedArraySearch, req.role,"Role Check");
    const result = allowedArraySearch.filter(
      (id) => id.toString() === req.role.toString()
    );
    if (!result.length) return res.status(401).json({ message: "Not Allowed" });
    if (!req?.email) return res.status(401).json({ message: "Not Allowed" });
    try {
      if (req.role === process.env.ADMIN) {
        const data = await db.query("SELECT email from admin where email=$1", [
          req.email,
        ]);
        if (data.rowCount === 0)
          return res.status(401).json({ message: "Not Allowed" });
      } else if (req.role === process.env.TEACHER) {
        const data = await db.query(
          "SELECT id,email_verified,verified_by_admin,verified_by_teacher from teacher where email=$1",
          [req.email]
        );
        if (data.rowCount === 0)
          return res.status(401).json({ message: "Not Allowed" });
        if (
          !data.rows[0].email_verified ||
          !data.rows[0].verified_by_admin ||
          !data.rows[0].verified_by_teacher
        )
          return res.status(401).json({ message: "Not Allowed" });
      } else if (req.role === process.env.USER) {
        const data = await db.query(
          "SELECT id,email_verified from student where email=$1",
          [req.email]
        );
        if (data.rowCount === 0)
          return res.status(401).json({ message: "Not Allowed" });
        if (!data.rows[0].email_verified)
          return res.status(401).json({ message: "Not Allowed" });
      } else {
        return res.status(401).json({ message: "Not Allowed" });
      }
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Some error occured, please relogin" });
    }
    next();
  };
};
module.exports = verifyRoles;
