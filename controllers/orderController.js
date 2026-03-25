const OrderModel = require('../models/orderModel');

exports.createOrder = async (req, res) => {
  try {
    const data = await OrderModel.createOrder(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const data = await OrderModel.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await OrderModel.findById(id);
    if (!data) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    await OrderModel.delete(id);
    res.status(200).json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrdersByTable = async (req, res) => {
  const { tableId } = req.params;
  try {
    const data = await OrderModel.getOrdersByTable(tableId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, payment_method } = req.body;
  try {
    const data = await OrderModel.updateStatus(id, status, payment_method);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getOrdersByPhone = async (req, res) => {
  const { phone } = req.params;
  try {
    const data = await OrderModel.getOrdersByPhone(phone);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
