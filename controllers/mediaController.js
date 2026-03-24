const db = require('../config/db');
// Nếu bạn có dùng cloudinary.v2 thì require vào để xoá ảnh thực tế.
const cloudinary = require('cloudinary').v2;

exports.getGallery = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM media_library ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.handleUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh' });
    
    // Lưu vào database để quản lý
    const { rows } = await db.query(
      'INSERT INTO media_library (url, public_id) VALUES ($1, $2) RETURNING *',
      [req.file.path, req.file.filename]
    );
    
    res.json({ success: true, url: req.file.path, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM media_library WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh' });

    const image = rows[0];
    // 1. Xoá trên Cloudinary dựa vào public_id
    if (image.public_id) {
       await cloudinary.uploader.destroy(image.public_id);
    }

    // 2. Xoá trong database
    await db.query('DELETE FROM media_library WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Đã xoá ảnh thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
