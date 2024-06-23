const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); // Get the file extension
    const basename = path.basename(file.originalname, ext); // Get the base name without the extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${basename}-${uniqueSuffix}${ext}`); // Construct the new fil
  },
});

const upload = multer({ storage: storage });

module.exports = { upload };
