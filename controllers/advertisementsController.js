const db = require("../config/dbConn");
const path = require("path");
const { uploadSingleFile, deleteFile } = require("../config/driveConn");
const fs = require("fs");
// GET
const getAll = async (req, res) => {
  const pageNum = parseInt(req.query.pageNum, 10) || 1;
  const startRow = (pageNum - 1) * 10;
  try {
    const data = await db.query(
      "SELECT * FROM ADVERTISEMENT ORDER BY timestamp DESC OFFSET $1 LIMIT 10",
      [startRow]
    );
    res.json(data.rows);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Some error occured" });
  }
};

// uploadSingleFile('example', path.join(__dirname, 'example.jpg'));

// DELETE
const deleteAdvertisement = async (req, res) => {
  const id = req?.body?.id || 1;
  if (!id) return res.status(400).json({ message: "Deletion id required" });
  try {
    const data = await db.query(
      "DELETE FROM ADVERTISEMENT WHERE id=$1 RETURNING *",
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
    return res.status(500).json({ message: "Error Deleting Advertisement" });
  }
};

// POST
const postAdvertisement = async (req, res) => {
  const { subject, timestamp } = req?.body;
  // console.log(req)
  // console.log(subject)
  try {
    const { file } = req;
    // console.log(file)
    if (file) {
      const url = await uploadSingleFile(
        file.originalname,
        path.join(__dirname, "..", file.path),
        process.env.DRIVE_NOTICE_FOLDER,
        file.mimetype
      );
      const data = await db.query(
        "INSERT INTO ADVERTISEMENT(subject, timestamp, url) VALUES($1, $2, $3) RETURNING *",
        [subject, new Date(timestamp).toISOString(), url]
      );
      fs.unlink(path.join(__dirname, "..", file.path), (err) => {
        if (err) {
          console.error("Error deleting file:", err);
          return;
        }
      });
      res.json({ message: "Advertisement posted successfully" });
    } else {
      return res.status(400).json({ message: "Advertisement requires file" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error posting advertisement" });
  }
};
module.exports = {
  getAll,
  deleteAdvertisement,
  postAdvertisement,
};
