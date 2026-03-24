const cloudinary = require('cloudinary').v2;
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Dùng memoryStorage thay vì CloudinaryStorage
// => Tương thích hoàn toàn với cloudinary v2
const storage = multer.memoryStorage();
const uploadCloud = multer({ storage });

/**
 * Upload buffer lên Cloudinary và trả về { url, public_id }
 * Dùng trong controller sau khi multer parse xong file
 */
const uploadToCloudinary = (buffer, folder = 'restaurant_iuh') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, allowed_formats: ['jpg', 'png', 'jpeg', 'webp'] },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

module.exports = uploadCloud;
module.exports.uploadToCloudinary = uploadToCloudinary;
module.exports.cloudinary = cloudinary;
