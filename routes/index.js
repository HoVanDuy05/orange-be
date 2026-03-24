const express = require('express');
const router = express.Router();

// Controllers
const tableController = require('../controllers/tableController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');
const statisticsController = require('../controllers/statisticsController');
const stockController = require('../controllers/stockController');
const mediaController = require('../controllers/mediaController');

// Middlewares
const { protect } = require('../middlewares/commonMiddleware');
const uploadCloud = require('../config/cloudinary');

// --- Auth ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// --- Media Library ---
router.get('/media', protect, mediaController.getGallery);
router.post('/upload', protect, uploadCloud.single('image'), mediaController.handleUpload);
router.delete('/media/:id', protect, mediaController.deleteMedia);

// --- Public Access ---
router.get('/tables', tableController.getAllTables);
router.get('/categories', categoryController.getAllCategories);
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);

router.post('/orders', orderController.createOrder); 
router.get('/orders/table-id/:tableId', orderController.getOrdersByTable);

// --- Admin Protected ---
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

// --- Stock ---
router.get('/stock', protect, stockController.getAllStock);
router.post('/stock', protect, stockController.addStock);
router.put('/stock/:id', protect, stockController.updateStock);
router.get('/stock/:id/history', protect, stockController.getHistory);
router.delete('/stock/:id', protect, stockController.removeStock);

// --- Stats ---
router.get('/stats/revenue', protect, statisticsController.getRevenueStats);

module.exports = router;
