const webpush = require('web-push');
const pool = require('../config/db');

// Setup VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:support@iuh.edu.vn',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

class PushController {
  /**
   * Đăng ký Subscription từ Client
   */
  static async subscribe(req, res) {
    try {
      const { customer_phone, subscription } = req.body;

      if (!customer_phone || !subscription) {
        return res.status(400).json({ success: false, message: 'Missing phone or subscription' });
      }

      // Xóa cũ thêm mới để đảm bảo mỗi SĐT chỉ có 1 subscription mới nhất
      await pool.query('DELETE FROM push_subscriptions WHERE customer_phone = $1', [customer_phone]);
      await pool.query(
        'INSERT INTO push_subscriptions (customer_phone, subscription) VALUES ($1, $2)',
        [customer_phone, JSON.stringify(subscription)]
      );

      res.status(201).json({ success: true, message: 'Subscribed successfully' });
    } catch (error) {
      console.error('❌ Push Subscribe error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Gửi thông báo Push cho một số điện thoại
   */
  static async sendNotification(customer_phone, title, body, data = {}) {
    try {
      const result = await pool.query(
        'SELECT subscription FROM push_subscriptions WHERE customer_phone = $1',
        [customer_phone]
      );

      if (result.rows.length === 0) return;

      const payload = JSON.stringify({
        notification: {
          title,
          body,
          icon: '/icon-192.png', // Logo IUH
          badge: '/icon-192.png',
          vibrate: [100, 50, 100],
          data: {
            url: data.url || '/',
            ...data
          }
        }
      });

      const promises = result.rows.map(row => {
        const sub = JSON.parse(row.subscription);
        return webpush.sendNotification(sub, payload).catch(err => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription đã hết hạn hoặc không còn tồn tại -> Xóa khỏi DB
            console.log('🗑️ Xóa subscription hết hạn:', customer_phone);
            return pool.query('DELETE FROM push_subscriptions WHERE customer_phone = $1', [customer_phone]);
          }
          throw err;
        });
      });

      await Promise.all(promises);
      console.log(`🚀 Đã gửi Push cho: ${customer_phone}`);
    } catch (error) {
      console.error('❌ Send Push Error:', error);
    }
  }
}

module.exports = PushController;
