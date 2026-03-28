const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dns = require('dns');
const logger = require('./config/logger');

// Force IPv4 to avoid ENETUNREACH with Supabase
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config();
process.env.TZ = 'Asia/Ho_Chi_Minh';

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────
// 🔒 Security Headers (Helmet)
// ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow image CDN
}));

// Disable x-powered-by header (don't expose Express)
app.disable('x-powered-by');

// ─────────────────────────────────────────────
// 🌐 CORS
// ─────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─────────────────────────────────────────────
// 📦 Body Parsing (limit payload size)
// ─────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

// ─────────────────────────────────────────────
// 📝 Logging
// ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─────────────────────────────────────────────
// 📖 Swagger Docs (only in non-production)
// ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi  = require('swagger-ui-express');
  const swaggerSpec = require('./config/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// ─────────────────────────────────────────────
// 🚀 Routes
// ─────────────────────────────────────────────
const mainRouter = require('./routes/index');
app.use('/api', mainRouter);

// ─────────────────────────────────────────────
// ❤️ Health Check
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    brand:   'Orange 🍊',
    version: '2.0.0',
    status:  'running',
    docs:    process.env.NODE_ENV !== 'production' ? '/api-docs' : 'disabled',
  });
});

// ─────────────────────────────────────────────
// 🔒 404 Handler
// ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} không tồn tại` });
});

// ─────────────────────────────────────────────
// ❌ Global Error Handler
// ─────────────────────────────────────────────
const { errorHandler } = require('./middlewares/commonMiddleware');
app.use(errorHandler);

// ─────────────────────────────────────────────
// 🎯 Start Server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🍊 Orange Server running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`📖 Docs: http://localhost:${PORT}/api-docs`);
  }
});

module.exports = app; // for testing
