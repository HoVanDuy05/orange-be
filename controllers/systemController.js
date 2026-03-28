const db = require('../config/db');
const logger = require('../config/logger');

exports.getBrands = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM brand_themes ORDER BY id ASC');
    res.json(rows);
  } catch (err) { 
    logger.error('Get Brands Error', err);
    next(err); 
  }
};

exports.updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brand_name, logo_url, primary_color, secondary_color } = req.body;
    
    // 1. Fetch current data to preserve unupdated fields
    const { rows } = await db.query('SELECT * FROM brand_themes WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Brand not found' });
    
    const current = rows[0];

    // 2. Perform merge update
    await db.query(`
      UPDATE brand_themes 
      SET 
        brand_name = COALESCE($1, brand_name), 
        logo_url = COALESCE($2, logo_url), 
        primary_color = COALESCE($3, primary_color), 
        secondary_color = COALESCE($4, secondary_color), 
        updated_at = NOW()
      WHERE id = $5
    `, [brand_name, logo_url, primary_color, secondary_color, id]);

    res.json({ success: true, message: 'Cập nhật nhận diện thương hiệu thành công' });
  } catch (err) { 
    logger.error('Update Brand Error', err);
    next(err); 
  }
};

exports.getBranches = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM branches ORDER BY id ASC');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.createBranch = async (req, res, next) => {
  try {
    const { name, address, phone } = req.body;
    await db.query('INSERT INTO branches (name, address, phone) VALUES ($1, $2, $3)', [name, address, phone]);
    res.status(201).json({ message: 'Branch created' });
  } catch (err) { next(err); }
};

exports.updateBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, phone, is_active } = req.body;
    await db.query('UPDATE branches SET name=$1, address=$2, phone=$3, is_active=$4 WHERE id=$5', [name, address, phone, is_active, id]);
    res.json({ message: 'Branch updated' });
  } catch (err) { next(err); }
};

exports.deleteBranch = async (req, res, next) => {
  try {
    await db.query('DELETE FROM branches WHERE id=$1', [req.params.id]);
    res.json({ message: 'Branch deleted' });
  } catch (err) { next(err); }
};
