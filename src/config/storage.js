const path = require('path');
const fs = require('fs');
const uploads = path.resolve(process.env.UPLOAD_DIRECTORY || path.join(__dirname, '../../uploads'));
fs.mkdirSync(uploads, { recursive: true });
module.exports = { uploads };
