const db = require("../config/dbConn");
const getClass = async (req, res) => {
  try {
    const data = await db.query("SELECT * from CLASS");
    // console.log(data);
    return res.json(data.rows);
  } catch (err) {
    return res.status(500).json({ message: "Some error occured" });
  }
};

const addClass = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Data Missing" });
  try {
    const data = await db.query("INSERT INTO CLASS(name) VALUES($1)", [name]);
    return res.status(200).json({ message: "Class Added Successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Some error occured" });
  }
};

module.exports = {
  getClass,
  addClass,
};
