const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const customerRoutes = require('../routes/customers');
const transactionRoutes = require('../routes/transactions');
const reportsRoutes = require('../routes/reports');
const analyticsRoutes = require('../routes/analytics');
const forecastRoutes = require('../routes/forecasts');
const paymentRoutes = require('../routes/payments');
const approvalRoutes = require('../routes/approvals');

const app = express();

// Security middleware
app.use(helmet());

// Set JWT secret if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
}

// CORS configuration
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
    'https://max-gas-transactions.vercel.app',
    'https://max-gas-transactions-*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('combined'));
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/approvals', approvalRoutes);

// Also handle routes without /api prefix for direct access
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/customers', customerRoutes);
app.use('/transactions', transactionRoutes);
app.use('/reports', reportsRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/forecasts', forecastRoutes);
app.use('/payments', paymentRoutes);
app.use('/approvals', approvalRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Max Gas Transactions API',
    version: '1.0.0',
    status: 'Production Mode',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Initialize database connection for serverless
let dbInitialized = false;

async function initializeDatabase() {
  if (dbInitialized) return;
  
  try {
    const { sequelize } = require('../config/database');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully');
    
    dbInitialized = true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
}

// Serverless handler
module.exports = async (req, res) => {
  try {
    // Initialize database on first request
    await initializeDatabase();
    
    // Handle the request
    return app(req, res);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}; 