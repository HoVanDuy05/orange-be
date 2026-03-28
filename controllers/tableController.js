const TableModel = require('../models/tableModel');

exports.getAllTables = async (req, res) => {
  try {
    const data = await TableModel.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTableById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await TableModel.findById(id);
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy bàn' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTable = async (req, res) => {
  const { table_name } = req.body;
  if (!table_name) {
    return res.status(400).json({ success: false, message: 'Thiếu tên bàn' });
  }
  try {
    const data = await TableModel.create(table_name);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTable = async (req, res) => {
  const { id } = req.params;
  const { table_name } = req.body;
  if (!table_name) {
    return res.status(400).json({ success: false, message: 'Thiếu tên bàn' });
  }
  try {
    const data = await TableModel.update(id, table_name);
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy bàn' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTable = async (req, res) => {
  const { id } = req.params;
  try {
    await TableModel.delete(id);
    res.status(200).json({ success: true, message: 'Đã xóa bàn thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
