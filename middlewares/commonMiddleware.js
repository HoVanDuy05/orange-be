const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// ─────────────────────────────────────────────
// 📝 Request Logger
// ─────────────────────────────────────────────
exports.logger = (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  logger.info(`${req.method} ${req.url} — IP: ${ip}`);
  next();
};

// ─────────────────────────────────────────────
// ❌ Global Error Handler
// ─────────────────────────────────────────────
exports.errorHandler = (err, req, res, next) => {
  logger.error('Unhandled', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Đã có lỗi xảy ra, vui lòng thử lại sau.'
      : err.message
  });
};

// ─────────────────────────────────────────────
// 🔒 JWT Auth Middleware
// ─────────────────────────────────────────────
exports.protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Không có quyền truy cập, thiếu token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Token đã hết hạn, vui lòng đăng nhập lại'
      : 'Token không hợp lệ';
    return res.status(401).json({ success: false, message: msg });
  }
};

// ─────────────────────────────────────────────
// 🔒 Role-Based Access Control
// ─────────────────────────────────────────────
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Chưa xác thực' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Yêu cầu quyền: ${roles.join(' hoặc ')}. Bạn đang là: ${req.user.role}`
    });
  }
  next();
};

// ─────────────────────────────────────────────
// 🚦 Rate Limiters
// ─────────────────────────────────────────────
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 15 phút.' },
  skipSuccessfulRequests: true,
});

exports.apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

exports.orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Tạo đơn quá nhanh, vui lòng thử lại sau.' },
});

// ─────────────────────────────────────────────
// ✅ Validation Result Handler
// ─────────────────────────────────────────────
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};
