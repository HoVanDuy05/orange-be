const OrderModel = require('../models/orderModel');
const PushController = require('./pushController');

exports.createOrder = async (req, res) => {
  try {
    const data = await OrderModel.createOrder(req.body);
    
    // 🚀 GỬI PUSH CHO ADMIN KHI CÓ ĐƠN MỚI
    // Lưu ý: data.table_id có thể undefined với khách mang đi
    PushController.sendNotification(
      'admin',
      '🔔 CÓ ĐƠN HÀNG MỚI!',
      `Đơn hàng #${data.id} đã được tạo thành công!`,
      { url: `/orders/${data.id}` }
    );

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
    console.log(`[DEBUG] getOrderById ${id}:`, JSON.stringify(data.items?.[0] || 'no items', null, 2));
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

const PushController = require('./pushController');

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, payment_method, cancel_reason } = req.body;
  try {
    const data = await OrderModel.updateStatus(id, status, payment_method || null, cancel_reason || null);
    
    // 🚀 GỬI PUSH NOTIFICATION (Nếu là trạng thái quan trọng)
    if (data && data.customer_phone) {
      if (status === 'done') {
        PushController.sendNotification(
          data.customer_phone,
          '🍜 ĐÃ XONG! MỜI BẠN NHẬN MÓN',
          `Đơn hàng #${id} của bạn đã hoàn tất. Vui lòng tới quầy nhận món nhé!`,
          { url: `/order-detail/${id}` }
        );
      } else if (status === 'cancelled') {
        PushController.sendNotification(
          data.customer_phone,
          '❌ ĐƠN HÀNG ĐÃ BỊ HUỶ',
          `Đơn hàng #${id} đã bị hủy. ${cancel_reason ? `Lý do: ${cancel_reason}` : 'Vui lòng liên hệ quầy để biết thêm chi tiết.'}`,
          { url: `/order-detail/${id}` }
        );
      }
    }

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
