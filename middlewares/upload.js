import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const propertyId = req.params.id;
    const dir = `./assets/${propertyId}`;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const propertyId = req.params.id;
    const dir = `./assets/${propertyId}`;
    const ext = path.extname(file.originalname).toLowerCase();

    // Get number of existing files to generate next index
    let existingFiles = fs
      .readdirSync(dir)
      .filter((f) => f.match(/\.(png|jpg|jpeg|webp|gif|mp4)$/));
    const index = existingFiles.length + 1;

    cb(null, `${index}${ext}`);
  },
});

const upload = multer({ storage });

export default upload;
