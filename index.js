const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dns = require('dns');
// Force Node to prefer IPv4 over IPv6 to fix ENETUNREACH errors with Supabase/Neon
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Middlewares
const { errorHandler, logger: requestLogger } = require('./middlewares/commonMiddleware');
app.use(requestLogger);
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
const mainRouter = require('./routes/index');
app.use('/api', mainRouter);

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the IUH Backend API' });
});

// Error handling at the end
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
