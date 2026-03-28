const express = require('express');
const router = express.Router();

// Controllers
const tableController = require('../controllers/tableController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');
const statisticsController = require('../controllers/statisticsController');
const mediaController = require('../controllers/mediaController');
const bannerController = require('../controllers/bannerController');
const notificationController = require('../controllers/notificationController');
const pushRoutes = require('./pushRoutes');

// Middlewares
const {
  protect,
  requireRole,
  apiLimiter,
  authLimiter,
  orderLimiter,
  validate,
} = require('../middlewares/commonMiddleware');

const {
  registerRules,
  loginRules,
  clientRegisterRules,
  clientLoginRules,
  createOrderRules,
  updateStatusRules,
  createProductRules,
  tableRules,
} = require('../middlewares/validationRules');

const uploadCloud = require('../config/cloudinary');

// ─── Apply general rate limit to all routes ────
router.use(apiLimiter);

// ══════════════════════════════════════════════
// 🔓 PUBLIC ROUTES
// ══════════════════════════════════════════════

// Auth
router.post('/auth/register', authLimiter, registerRules, validate, authController.register);
router.post('/auth/login', authLimiter, loginRules, validate, authController.login);
router.post('/auth/client/register', authLimiter, clientRegisterRules, validate, authController.clientRegister);
router.post('/auth/client/login', authLimiter, clientLoginRules, validate, authController.clientLogin);
router.get('/auth/me', protect, authController.getMe);

// Menu (read-only, no auth required)
router.get('/categories', categoryController.getAllCategories);
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);
router.get('/banners', bannerController.getAllBanners);

// Tables (read-only public — customers need to see table availability)
router.get('/tables', tableController.getAllTables);
router.get('/tables/:id', tableController.getTableById);

// Orders — customer creates + tracks own order (rate-limited for anti-spam)
router.post('/orders', orderLimiter, createOrderRules, validate, orderController.createOrder);
router.get('/orders/:id', orderController.getOrderById);
router.get('/orders/table/:tableId', orderController.getOrdersByTable);
router.get('/orders/phone/:phone', orderController.getOrdersByPhone);

// Push notifications — public subscribe
router.use('/push', pushRoutes);

// ══════════════════════════════════════════════
// 🔒 ADMIN / STAFF PROTECTED ROUTES
// ══════════════════════════════════════════════

// Orders — admin reads all & updates
router.get('/orders', protect, orderController.getAllOrders);
router.patch('/orders/:id/status', protect, updateStatusRules, validate, orderController.updateOrderStatus);
router.patch('/orders/:id/items/:itemId', protect, orderController.updateOrderItem);
router.delete('/orders/:id', protect, requireRole('admin'), orderController.deleteOrder);

// Tables — only admin manages
router.post('/tables', protect, requireRole('admin'), tableRules, validate, tableController.createTable);
router.put('/tables/:id', protect, requireRole('admin'), tableRules, validate, tableController.updateTable);
router.delete('/tables/:id', protect, requireRole('admin'), tableController.deleteTable);

// Categories — admin only
router.post('/categories', protect, requireRole('admin'), categoryController.createCategory);
router.put('/categories/:id', protect, requireRole('admin'), categoryController.updateCategory);
router.delete('/categories/:id', protect, requireRole('admin'), categoryController.deleteCategory);

// Products — admin only
router.post('/products', protect, requireRole('admin'), createProductRules, validate, productController.createProduct);
router.put('/products/:id', protect, requireRole('admin'), createProductRules, validate, productController.updateProduct);
router.delete('/products/:id', protect, requireRole('admin'), productController.deleteProduct);

// Banners — admin only
router.post('/banners', protect, requireRole('admin'), bannerController.createBanner);
router.put('/banners/:id', protect, requireRole('admin'), bannerController.updateBanner);
router.delete('/banners/:id', protect, requireRole('admin'), bannerController.deleteBanner);

// Media — staff & admin
router.get('/media', protect, mediaController.getGallery);
router.post('/upload', protect, uploadCloud.single('image'), mediaController.handleUpload);
router.delete('/media/:id', protect, requireRole('admin'), mediaController.deleteMedia);

// Statistics — admin only
router.get('/stats/revenue', protect, requireRole('admin'), statisticsController.getRevenueStats);
router.get('/stats/today', protect, statisticsController.getTodayStats);

// Notifications — staff & admin
router.get('/notifications', protect, notificationController.getNotifications);
router.patch('/notifications/:id/read', protect, notificationController.markRead);
router.post('/notifications/read-all', protect, notificationController.markAllRead);
router.delete('/notifications/:id', protect, notificationController.deleteNotification);
router.delete('/notifications', protect, notificationController.clearAll);

// ══════════════════════════════════════════════
// 🏢 BRANCHES & EMPLOYEES & SYSTEM SETTINGS
// ══════════════════════════════════════════════
const systemController = require('../controllers/systemController');
const employeeController = require('../controllers/employeeController');

// Brands (Public read for templates)
router.get('/system/themes', systemController.getBrands);
router.get('/system/brands', systemController.getBrands);
router.put('/system/brands/:id', protect, requireRole('admin'), systemController.updateBrand);

// Branches
router.get('/branches', systemController.getBranches);
router.post('/branches', protect, requireRole('admin'), systemController.createBranch);
router.put('/branches/:id', protect, requireRole('admin'), systemController.updateBranch);
router.delete('/branches/:id', protect, requireRole('admin'), systemController.deleteBranch);

// Employees
router.get('/employees', protect, requireRole('admin'), employeeController.getEmployees);
router.post('/employees', protect, requireRole('admin'), employeeController.createEmployee);
router.put('/employees/:id', protect, requireRole('admin'), employeeController.updateEmployee);
router.delete('/employees/:id', protect, requireRole('admin'), employeeController.deleteEmployee);

module.exports = router;
