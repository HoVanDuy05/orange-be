const webpush = require('web-push');
const db = require('../config/db');
const logger = require('../config/logger');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:support@orange.vn',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

class PushController {
  /**
   * POST /api/push/subscribe
   * Register a push subscription tied to a customer phone or 'admin'
   */
  static async subscribe(req, res) {
    try {
      const { customer_phone, subscription } = req.body;
      logger.info('🔔 Nhận yêu cầu đăng ký Push:', { customer_phone, endpoint: subscription?.endpoint });

      if (!customer_phone || !subscription || !subscription.endpoint) {
        logger.warn('🚫 Đăng ký Push thất bại: Thiếu dữ liệu', { customer_phone, hasSub: !!subscription });
        return res.status(400).json({ success: false, message: 'Thiếu dữ liệu đăng ký hợp lệ' });
      }

      const p256dh = subscription.keys?.p256dh;
      const auth = subscription.keys?.auth;

      if (!p256dh || !auth) {
        logger.warn('🚫 Đăng ký Push thất bại: Thiếu keys', { customer_phone });
        return res.status(400).json({ success: false, message: 'Subscription thiếu mã bảo mật (keys)' });
      }

      // Upsert logic
      try {
        await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [subscription.endpoint]);
        
        await db.query(
          'INSERT INTO push_subscriptions (customer_phone, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4)',
          [customer_phone, subscription.endpoint, p256dh, auth]
        );
      } catch (dbErr) {
        logger.error('❌ Lỗi Database khi đăng ký Push:', dbErr);
        throw dbErr; // Rethrow to main catch
      }

      logger.info('✅ Đăng ký Push thành công:', customer_phone);
      res.status(201).json({ success: true, message: 'Đăng ký nhận thông báo thành công' });
    } catch (error) {
      logger.error('💥 Lỗi hệ thống khi đăng ký Push:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Đăng ký thông báo thất bại: ' + (error.message || 'Lỗi không xác định') 
      });
    }
  }

  /**
   * Send a push notification (fire-and-forget, returns a Promise).
   * customer_phone: phone number or 'admin'
   */
  static async sendNotification(customer_phone, title, body, data = {}) {
    try {
      const { rows } = await db.query(
        'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE customer_phone = $1',
        [customer_phone]
      );
      if (rows.length === 0) return;

      const payload = JSON.stringify({
        notification: {
          title,
          body,
          icon:    '/icon-192.png',
          badge:   '/icon-192.png',
          vibrate: [100, 50, 100],
          data:    { url: data.url || '/', ...data }
        }
      });

      const promises = rows.map(row => {
        const sub = {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth }
        };
        return webpush.sendNotification(sub, payload).catch(err => {
          // Expired/invalid subscription — clean up DB
          if (err.statusCode === 404 || err.statusCode === 410) {
            return db.query(
              'DELETE FROM push_subscriptions WHERE endpoint = $1',
              [row.endpoint]
            );
          }
          logger.error(`Push send [${customer_phone}]`, err);
        });
      });

      await Promise.all(promises);
    } catch (error) {
      logger.error('sendNotification', error);
    }
  }
}

module.exports = PushController;
