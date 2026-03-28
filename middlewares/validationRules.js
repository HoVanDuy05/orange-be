const { body } = require('express-validator');

// ─────────────────────────────────────────────
// Auth Validators
// ─────────────────────────────────────────────
exports.registerRules = [
  body('full_name')
    .trim().notEmpty().withMessage('Tên đầy đủ là bắt buộc')
    .isLength({ max: 100 }).withMessage('Tên tối đa 100 ký tự'),

  body('email')
    .trim().notEmpty().withMessage('Email là bắt buộc')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Mật khẩu là bắt buộc')
    .isLength({ min: 8 }).withMessage('Mật khẩu tối thiểu 8 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Mật khẩu phải có chữ hoa, chữ thường và số'),

  body('role')
    .optional()
    .isIn(['admin', 'staff']).withMessage('Role chỉ được là admin hoặc staff'),
];

exports.loginRules = [
  body('email').trim().notEmpty().isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
];

// ─────────────────────────────────────────────
// Order Validators
// ─────────────────────────────────────────────
exports.createOrderRules = [
  body('order_type')
    .optional()
    .isIn(['dine_in', 'take_away', 'delivery']).withMessage('order_type không hợp lệ'),

  body('customer_name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 }).withMessage('Tên khách tối đa 150 ký tự')
    .escape(),

  body('customer_phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^(0|\+84)[0-9]{8,10}$/).withMessage('Số điện thoại không hợp lệ'),

  body('shipping_address')
    .if(body('order_type').equals('delivery'))
    .notEmpty().withMessage('Đơn giao hàng cần có địa chỉ')
    .trim()
    .isLength({ max: 500 }).withMessage('Địa chỉ tối đa 500 ký tự')
    .escape(),

  body('note')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Ghi chú tối đa 500 ký tự')
    .escape(),

  body('items')
    .isArray({ min: 1 }).withMessage('Đơn hàng phải có ít nhất 1 sản phẩm'),

  body('items.*.product_id')
    .isInt({ min: 1 }).withMessage('product_id không hợp lệ'),

  body('items.*.quantity')
    .isInt({ min: 1, max: 100 }).withMessage('Số lượng phải từ 1 đến 100'),
];

exports.updateStatusRules = [
  body('status')
    .notEmpty().withMessage('Trạng thái là bắt buộc')
    .isIn(['pending', 'confirmed', 'preparing', 'delivering', 'served', 'completed', 'cancelled'])
    .withMessage('Trạng thái không hợp lệ'),

  body('payment_method')
    .optional({ checkFalsy: true })
    .isIn(['cash', 'transfer', 'momo', 'vnpay']).withMessage('Phương thức thanh toán không hợp lệ'),

  body('cancel_reason')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Lý do hủy tối đa 500 ký tự')
    .escape(),
];

// ─────────────────────────────────────────────
// Product Validators
// ─────────────────────────────────────────────
exports.createProductRules = [
  body('product_name')
    .trim().notEmpty().withMessage('Tên sản phẩm là bắt buộc')
    .isLength({ max: 150 }).withMessage('Tên sản phẩm tối đa 150 ký tự')
    .escape(),

  body('price')
    .notEmpty().withMessage('Giá sản phẩm là bắt buộc')
    .isFloat({ min: 0 }).withMessage('Giá sản phẩm phải là số dương'),

  body('category_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('category_id không hợp lệ'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Mô tả tối đa 1000 ký tự')
    .escape(),
];

// ─────────────────────────────────────────────
// Table Validators
// ─────────────────────────────────────────────
exports.tableRules = [
  body('table_name')
    .trim().notEmpty().withMessage('Tên bàn là bắt buộc')
    .isLength({ max: 50 }).withMessage('Tên bàn tối đa 50 ký tự')
    .escape(),
];
