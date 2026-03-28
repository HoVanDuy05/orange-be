const OrderModel = require('../models/orderModel');
const PushController = require('./pushController');
const logger = require('../config/logger');

/** POST /api/orders */
exports.createOrder = async (req, res) => {
  try {
    const data = await OrderModel.create(req.body);

    // Push notification to admin when new order arrives
    const typeLabels = {
      dine_in: 'Phục vụ tại bàn',
      take_away: 'Khách mang đi',
      delivery: 'Giao hàng'
    };
    const typeLabel = typeLabels[data.order_type] || 'Mới';
    
    PushController.sendNotification(
      'admin',
      '🔔 THÔNG BÁO ĐƠN HÀNG',
      `Hệ thống vừa nhận đơn ${typeLabel} #${data.id}. Vui lòng kiểm tra và xử lý!`,
      { url: `/orders/${data.id}` }
    ).catch((e) => logger.error('Push new order', e));

    res.status(201).json({ success: true, data });
  } catch (error) {
    const isValidation = error.message.includes('không hợp lệ') || error.message.includes('cần có');
    res.status(isValidation ? 400 : 500).json({ success: false, message: error.message });
  }
};

/** GET /api/orders?status=&type=&date= */
exports.getAllOrders = async (req, res) => {
  const { status, type, date, page, limit } = req.query;
  try {
    const data = await OrderModel.getAll({ status, type, date, page, limit });
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/orders/:id */
exports.getOrderById = async (req, res) => {
  try {
    const data = await OrderModel.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/orders/table/:tableId — active orders only */
exports.getOrdersByTable = async (req, res) => {
  try {
    const data = await OrderModel.getByTable(req.params.tableId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/orders/phone/:phone */
exports.getOrdersByPhone = async (req, res) => {
  try {
    const data = await OrderModel.getByPhone(req.params.phone);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** PATCH /api/orders/:id/status */
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, payment_method, cancel_reason } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Thiếu trạng thái (status)' });
  }

  try {
    const data = await OrderModel.updateStatus(id, status, payment_method, cancel_reason);

    // Push notifications to customer
    if (data?.customer_phone) {
      const notifMap = {
        confirmed: {
          title: '✅ Đơn đã được xác nhận',
          body: `Đơn #${id} của bạn đã được tiếp nhận, đang chuẩn bị!`
        },
        preparing: {
          title: '🍹 Đang pha chế',
          body: `Đơn #${id} đang được pha chế. Xin chờ một chút nhé!`
        },
        delivering: {
          title: '🚗 Đang giao hàng',
          body: `Đơn #${id} đang trên đường đến chỗ bạn!`
        },
        served: {
          title: '✨ Đồ uống đã sẵn sàng',
          body: `Đơn #${id} đã được mang ra / sẵn sàng để nhận!`
        },
        completed: {
          title: '🎉 Hoàn thành',
          body: `Cảm ơn bạn đã dùng dịch vụ Orange! Hẹn gặp lại 🍊`
        },
        cancelled: {
          title: '❌ Đơn đã bị hủy',
          body: `Đơn #${id} bị hủy. ${cancel_reason ? `Lý do: ${cancel_reason}` : 'Vui lòng liên hệ quán.'}`
        }
      };

      const notif = notifMap[status];
      if (notif) {
        PushController.sendNotification(data.customer_phone, notif.title, notif.body, {
          url: `/order-detail/${id}`
        }).catch((e) => logger.error('Push status update', e));
      }
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    const isValidation = error.message.includes('không hợp lệ') || error.message.includes('Không tìm thấy');
    res.status(isValidation ? 400 : 500).json({ success: false, message: error.message });
  }
};

/** PATCH /api/orders/:id/items/:itemId — Mark a single drink as done */
exports.updateOrderItem = async (req, res) => {
  const { id, itemId } = req.params;
  const { is_completed } = req.body;
  try {
    const data = await OrderModel.updateItemStatus(id, itemId, is_completed);
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy item' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** DELETE /api/orders/:id */
exports.deleteOrder = async (req, res) => {
  try {
    await OrderModel.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Đã xóa đơn hàng' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
