const db = require('../config/db');
const { uploadToCloudinary, cloudinary } = require('../config/cloudinary');

exports.getGallery = async (req, res) => {
  try {
    const { folder } = req.query;
    let query = 'SELECT * FROM media_library';
    const params = [];

    if (folder && folder !== 'all') {
      query += ' WHERE folder = $1';
      params.push(folder);
    }

    query += ' ORDER BY created_at DESC';
    const { rows } = await db.query(query, params);
    
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.handleUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh' });

    // Lấy folder từ query hoặc body (mặc định là restaurant_iuh)
    const folder = req.query.folder || req.body.folder || 'restaurant_iuh';
    
    // Upload buffer lên Cloudinary thông qua uploadToCloudinary()
    const { url, public_id } = await uploadToCloudinary(req.file.buffer, folder);

    // Lưu vào database để quản lý
    const { rows } = await db.query(
      'INSERT INTO media_library (url, public_id, folder) VALUES ($1, $2, $3) RETURNING *',
      [url, public_id, folder]
    );

    res.json({ success: true, url, data: rows[0] });
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
    // 1. Xoá trên Cloudinary
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
