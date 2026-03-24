const express = require('express');
const router = express.Router();

// Controllers
const tableController = require('../controllers/tableController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');
const statisticsController = require('../controllers/statisticsController');

// Middlewares
const { protect } = require('../middlewares/commonMiddleware');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string }
 */
router.post('/auth/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and get JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 */
router.post('/auth/login', authController.login);

// --- Public Access Routes ---
/**
 * @swagger
 * /tables:
 *   get:
 *     summary: Lấy danh sách bàn
 *     tags: [Public]
 */
router.get('/tables', tableController.getAllTables);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Lấy danh sách danh mục
 *     tags: [Public]
 */
router.get('/categories', categoryController.getAllCategories);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     tags: [Public]
 */
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Khách gọi món (Tạo đơn hàng)
 *     tags: [Public]
 */
router.post('/orders', orderController.createOrder); // Ordering is public
router.get('/orders/table-id/:tableId', orderController.getOrdersByTable); // For customer tracking

// --- Private Access Routes (Staff/Admin only) ---
/**
 * @swagger
 * /tables:
 *   post:
 *     summary: Thêm bàn mới (Admin)
 *     tags: [Admin - Tables]
 */
router.post('/tables', protect, tableController.createTable);
router.put('/tables/:id', protect, tableController.updateTable);
router.delete('/tables/:id', protect, tableController.deleteTable);
router.patch('/tables/:id/status', protect, tableController.updateTableStatus);

router.post('/categories', protect, categoryController.createCategory);
router.put('/categories/:id', protect, categoryController.updateCategory);
router.delete('/categories/:id', protect, categoryController.deleteCategory);

router.post('/products', protect, productController.createProduct);
router.put('/products/:id', protect, productController.updateProduct);
router.delete('/products/:id', protect, productController.deleteProduct);

router.get('/orders', protect, orderController.getAllOrders);
router.get('/orders/:id', protect, orderController.getOrderById);
router.patch('/orders/:id/status', protect, orderController.updateOrderStatus);
router.delete('/orders/:id', protect, orderController.deleteOrder);

// --- Statistics (Admin only) ---
/**
 * @swagger
 * /stats/revenue:
 *   get:
 *     summary: Thống kê doanh thu (Admin)
 *     tags: [Admin - Statistics]
 */
router.get('/stats/revenue', protect, statisticsController.getRevenueStats);

module.exports = router;
