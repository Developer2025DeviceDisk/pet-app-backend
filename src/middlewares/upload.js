const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// For pet profile images only (strict images)
const imageFileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
};

// For chat media (images + videos)
const mediaFileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|mp4|mov|avi|mkv|webm/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetypes = /image\/(jpeg|jpg|png|webp)|video\/(mp4|quicktime|x-msvideo|x-matroska|webm)/;
    const mimetype = mimetypes.test(file.mimetype);
    if (mimetype || extname) {
        return cb(null, true);
    } else {
        cb('Error: Images and Videos Only!');
    }
};

// Default upload (images only) – used for pet profile photos
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB
    fileFilter: imageFileFilter
});

// Media upload (images + videos) – used for chat media
upload.media = multer({
    storage: storage,
    limits: { fileSize: 50000000 }, // 50MB for videos
    fileFilter: mediaFileFilter
});

module.exports = upload;
