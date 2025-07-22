const express = require('express');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Migrate production database schema - ADMIN ONLY
router.post('/migrate-db', authenticateToken, requirePermission('users:create'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Admin privileges required.' 
      });
    }

    console.log('🚀 Starting production database migration...');
    const isPostgreSQL = sequelize.getDialect() === 'postgres';
    
    if (!isPostgreSQL) {
      return res.status(400).json({
        success: false,
        error: 'Migration only supported for PostgreSQL databases'
      });
    }

    // Add missing columns to customers table
    console.log('📝 Adding missing columns to customers table...');
    await sequelize.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS financial_balance DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS cylinder_balance INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS cylinder_balance_6kg INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS cylinder_balance_13kg INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS cylinder_balance_50kg INTEGER DEFAULT 0;
    `, { type: QueryTypes.RAW });

    // Add missing columns to transactions table
    console.log('📝 Adding missing columns to transactions table...');
    await sequelize.query(`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS transaction_number VARCHAR(20),
      ADD COLUMN IF NOT EXISTS load_6kg INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS load_13kg INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS load_50kg INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS returns_breakdown JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS outright_breakdown JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS total_returns INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_load INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS cylinder_balance_6kg INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS cylinder_balance_13kg INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS cylinder_balance_50kg INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS cylinder_balance INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS financial_balance DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_bill DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash',
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `, { type: QueryTypes.RAW });

    // Create unique index for transaction_number if it doesn't exist
    console.log('📝 Creating unique index for transaction_number...');
    try {
      await sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS transactions_transaction_number_unique 
        ON transactions (transaction_number);
      `, { type: QueryTypes.RAW });
    } catch (error) {
      console.log('ℹ️ Index creation skipped (may already exist)');
    }

    // Generate transaction numbers for existing transactions without them
    console.log('📝 Generating transaction numbers for existing transactions...');
    const transactionsWithoutNumbers = await sequelize.query(`
      SELECT id FROM transactions WHERE transaction_number IS NULL ORDER BY id ASC;
    `, { type: QueryTypes.SELECT });

    let counter = 1;
    for (const transaction of transactionsWithoutNumbers) {
      const transactionNumber = `A${String(counter).padStart(4, '0')}`;
      await sequelize.query(`
        UPDATE transactions SET transaction_number = :transactionNumber WHERE id = :id;
      `, {
        type: QueryTypes.UPDATE,
        replacements: { transactionNumber, id: transaction.id }
      });
      counter++;
    }

    console.log('✅ Database migration completed successfully!');
    
    res.json({
      success: true,
      message: 'Database migration completed successfully',
      details: {
        customersUpdated: 'Added detailed cylinder balance fields',
        transactionsUpdated: 'Added detailed tracking and transaction numbers',
        transactionNumbersGenerated: transactionsWithoutNumbers.length
      }
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed: ' + error.message,
      details: error.stack
    });
  }
});

// Clear branches table data
router.post('/clear-branches', authenticateToken, requirePermission('users:create'), async (req, res) => {
  try {
    // Double-check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can clear branches data'
      });
    }
    
    console.log('🗑️ Clearing branches table data...');
    
    // Clear all branches data
    const deletedCount = await sequelize.query('DELETE FROM branches;', { type: QueryTypes.DELETE });
    
    // Reset sequence if PostgreSQL
    const isPostgreSQL = sequelize.getDialect() === 'postgres';
    if (isPostgreSQL) {
      try {
        await sequelize.query('ALTER SEQUENCE branches_id_seq RESTART WITH 1;', { type: QueryTypes.RAW });
      } catch (error) {
        console.log('ℹ️ Branch sequence reset not needed or failed (non-critical)');
      }
    }
    
    console.log('✅ Branches data cleared successfully');
    
    res.json({
      success: true,
      message: 'Branches data cleared successfully',
      details: {
        deleted_count: deletedCount,
        table_preserved: true
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to clear branches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear branches data',
      error: error.message
    });
  }
});

module.exports = router; 