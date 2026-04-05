const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'src/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, safeName);
  }
});

const upload = multer({ storage });

module.exports = { upload, uploadDir };
