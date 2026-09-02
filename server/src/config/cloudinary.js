const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  // Do not let a stalled Cloudinary connection keep a submission open.
  timeout: 20000,
  upload_timeout: 20000,
});

module.exports = cloudinary;
