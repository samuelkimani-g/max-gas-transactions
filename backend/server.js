const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Import database and models
const { sequelize } = require('./config/database');
require('./models'); // This will load all models and associations

// Import migration
const migrate = require('./scripts/migrate-db');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const transactionRoutes = require('./routes/transactions');
const reportsRoutes = require('./routes/reports');
const analyticsRoutes = require('./routes/analytics');
const paymentRoutes = require('./routes/payments');
const approvalRoutes = require('./routes/approvals');
const adminRoutes = require('./routes/admin');
const inventoryRoutes = require('./routes/inventory');
const forecastRoutes = require('./routes/forecast');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for production deployment (fixes rate limiting warnings)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Set JWT secret if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
}

// CORS configuration - allow localhost ports for development and production URLs
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5181',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
    'http://127.0.0.1:5177',
    'http://127.0.0.1:5178',
    'http://127.0.0.1:5181',
    'https://max-gas-transactions.vercel.app',
    'https://max-gas-transactions-git-main-samuels-projects-a44fd59b.vercel.app',
    'https://max-gas-transactions-n83ibkmnl-samuels-projects-a44fd59b.vercel.app',
    'https://gas-cylinder-dashboard.vercel.app',
    'https://gas-cylinder-dashboard-jp63mfnmm-samuels-projects-a44fd59b.vercel.app',
    // Allow all Vercel preview URLs
    /^https:\/\/max-gas-transactions-.*\.vercel\.app$/,
    /^https:\/\/gas-cylinder-dashboard-.*\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5181',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
    'http://127.0.0.1:5177',
    'http://127.0.0.1:5178',
    'http://127.0.0.1:5181',
    'https://max-gas-transactions.vercel.app',
    'https://max-gas-transactions-git-main-samuels-projects-a44fd59b.vercel.app',
    'https://max-gas-transactions-n83ibkmnl-samuels-projects-a44fd59b.vercel.app',
    'https://gas-cylinder-dashboard.vercel.app',
    'https://gas-cylinder-dashboard-jp63mfnmm-samuels-projects-a44fd59b.vercel.app'
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database connection for serverless on first request
let dbInitialized = false;

app.use(async (req, res, next) => {
  if (!dbInitialized && (process.env.NODE_ENV === 'production' && process.env.VERCEL)) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed'
      });
    }
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Gas Cylinder Dashboard API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/forecast', forecastRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  // Sequelize unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry',
      errors: error.errors.map(err => ({
        field: err.path,
        message: `${err.path} already exists`
      }))
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// Database connection and server startup
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Run database migration
    console.log('🔧 Running database migration...');
    const migrationSuccess = await migrate();
    if (migrationSuccess) {
      console.log('✅ Database migration completed successfully');
    } else {
      console.log('⚠️ Database migration had issues, but continuing...');
    }

    // Setup payments table
    console.log('🔧 Setting up payments table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          transaction_id INTEGER NOT NULL REFERENCES transactions(id),
          customer_id INTEGER NOT NULL REFERENCES customers(id),
          amount DECIMAL(10,2) NOT NULL,
          payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
          reference VARCHAR(100),
          receipt_number VARCHAR(50) UNIQUE,
          branch_id INTEGER REFERENCES branches(id),
          processed_by INTEGER NOT NULL DEFAULT 1,
          status VARCHAR(20) NOT NULL DEFAULT 'completed',
          notes TEXT,
          payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      // Create indexes
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
        CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
        CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
      `);
      
      console.log('✅ Payments table setup completed successfully');
    } catch (error) {
      console.log('⚠️ Payments table setup had issues, but continuing...', error.message);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}`);
      console.log(`🔍 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS enabled for: localhost:3000, localhost:5173-5178, localhost:5181`);
    });

  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

// Initialize database connection for serverless
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

// Keep-alive mechanism to prevent Render free tier from sleeping
const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes
const SERVER_URL = process.env.RENDER_EXTERNAL_URL || 'https://max-gas-backend.onrender.com';

function keepAlive() {
  console.log('[KEEP-ALIVE] Pinging server to prevent sleep...');
  fetch(`${SERVER_URL}/health`)
    .then(res => {
      if (res.ok) {
        console.log('[KEEP-ALIVE] Server ping successful');
      } else {
        console.log('[KEEP-ALIVE] Server ping failed:', res.status);
      }
    })
    .catch(err => {
      console.log('[KEEP-ALIVE] Server ping error:', err.message);
    });
}

// Start keep-alive only in production
if (process.env.NODE_ENV === 'production') {
  console.log('[KEEP-ALIVE] Starting keep-alive mechanism...');
  setInterval(keepAlive, KEEP_ALIVE_INTERVAL);
  
  // Initial ping after 1 minute
  setTimeout(keepAlive, 60000);
}

// Export the app for Vercel serverless
module.exports = app;

// Start the server only if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
} 