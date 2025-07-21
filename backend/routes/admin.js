const express = require('express');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Migrate production database schema - ADMIN ONLY
router.post('/migrate-db', authenticateToken, requirePermission('users:create'), async (req, res) => {
  try {
    // Double-check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can perform database migrations'
      });
    }
    
    console.log('🚀 Starting production database migration...');
    
    // Check if we're using PostgreSQL (production)
    const isPostgreSQL = sequelize.getDialect() === 'postgres';
    
    if (!isPostgreSQL) {
      return res.json({ 
        success: true, 
        message: 'Local SQLite detected - migration not needed',
        details: 'Use npm run db:reset for local development'
      });
    }
    
    console.log('🐘 PostgreSQL detected - Running production migration');
    
    // Add missing columns to customers table
    try {
      await sequelize.query(`
        ALTER TABLE customers 
        ADD COLUMN IF NOT EXISTS financial_balance DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS cylinder_balance INTEGER DEFAULT 0;
      `, { type: QueryTypes.RAW });
      console.log('✅ Added financial_balance and cylinder_balance to customers');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('ℹ️ Customer columns already exist');
    }
    
    // Add missing columns to transactions table
    try {
      await sequelize.query(`
        ALTER TABLE transactions 
        ADD COLUMN IF NOT EXISTS returns_breakdown JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS outright_breakdown JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS total_returns INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_load INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS cylinder_balance INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS financial_balance DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_bill DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash';
      `, { type: QueryTypes.RAW });
      console.log('✅ Added new transaction columns');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('ℹ️ Transaction columns already exist');
    }
    
    // Clear all customer and transaction data (as requested)
    await sequelize.query('DELETE FROM transactions;', { type: QueryTypes.DELETE });
    await sequelize.query('DELETE FROM customers;', { type: QueryTypes.DELETE });
    
    // Reset sequences
    try {
      await sequelize.query('ALTER SEQUENCE customers_id_seq RESTART WITH 1;', { type: QueryTypes.RAW });
      await sequelize.query('ALTER SEQUENCE transactions_id_seq RESTART WITH 1;', { type: QueryTypes.RAW });
    } catch (error) {
      console.log('ℹ️ Sequence reset not needed or failed (non-critical)');
    }
    
    console.log('✅ Production migration completed successfully');
    
    res.json({
      success: true,
      message: 'Database migration completed successfully',
      details: {
        schema_updated: true,
        data_cleared: true,
        users_preserved: true
      }
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database migration failed',
      error: error.message
    });
  }
});

module.exports = router; 