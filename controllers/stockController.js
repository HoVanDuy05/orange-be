const StockModel = require('../models/stockModel');

exports.getAllStock = async (req, res) => {
  try {
    const data = await StockModel.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const data = await StockModel.getHistory(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addStock = async (req, res) => {
  try {
    const { item_name, quantity, unit_price, supplier, stock_date, buyer_name, unit } = req.body;
    const data = await StockModel.create({
      item_name,
      quantity,
      unit_price,
      supplier,
      stock_date: stock_date || new Date(),
      buyer_name: buyer_name || 'Hệ thống',
      unit: unit || 'Kg'
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { item_name, quantity, unit_price, supplier, stock_date, buyer_name, unit } = req.body;
    const updated_by = req.user.full_name || `ID:${req.user.id}`;
    
    const data = await StockModel.update(req.params.id, {
      item_name,
      quantity,
      unit_price,
      supplier,
      stock_date,
      buyer_name,
      unit,
      updated_by
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeStock = async (req, res) => {
  try {
    await StockModel.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Xoá phiếu nhập kho thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
