// backend/scripts/migrate-production-db.js
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const migrateDatabase = async () => {
  console.log('--- Starting Production Database Migration ---');
  
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check if we're using PostgreSQL (production) or SQLite (local)
    const isPostgreSQL = sequelize.getDialect() === 'postgres';
    
    if (isPostgreSQL) {
      console.log('🐘 PostgreSQL detected - Running production migration');
      
      // Add missing columns to customers table if they don't exist
      console.log('📝 Adding missing columns to customers table...');
      
      try {
        await sequelize.query(`
          ALTER TABLE customers 
          ADD COLUMN IF NOT EXISTS financial_balance DECIMAL(10,2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS cylinder_balance INTEGER DEFAULT 0;
        `, { type: QueryTypes.RAW });
        console.log('✅ Added financial_balance and cylinder_balance columns');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('ℹ️ Columns already exist, skipping...');
        } else {
          throw error;
        }
      }
      
      // Add missing columns to transactions table if they don't exist
      console.log('📝 Adding missing columns to transactions table...');
      
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
        if (error.message.includes('already exists')) {
          console.log('ℹ️ Transaction columns already exist, skipping...');
        } else {
          throw error;
        }
      }
      
    } else {
      console.log('📁 SQLite detected - Using sync for local development');
      // For local SQLite, just sync the models
      await sequelize.sync({ alter: true });
      console.log('✅ SQLite schema updated');
    }
    
    // Clear customer and transaction data while preserving users
    console.log('🗑️ Clearing customer and transaction data...');
    
    // Delete transactions first (foreign key constraint)
    const deletedTransactions = await sequelize.query(
      'DELETE FROM transactions;',
      { type: QueryTypes.DELETE }
    );
    console.log(`✅ Deleted all transactions`);
    
    // Delete customers
    const deletedCustomers = await sequelize.query(
      'DELETE FROM customers;',
      { type: QueryTypes.DELETE }
    );
    console.log(`✅ Deleted all customers`);
    
    // Reset auto-increment counters if PostgreSQL
    if (isPostgreSQL) {
      await sequelize.query('ALTER SEQUENCE customers_id_seq RESTART WITH 1;', { type: QueryTypes.RAW });
      await sequelize.query('ALTER SEQUENCE transactions_id_seq RESTART WITH 1;', { type: QueryTypes.RAW });
      console.log('✅ Reset ID sequences');
    }
    
    // Verify users are still there
    const userCount = await sequelize.query(
      'SELECT COUNT(*) as count FROM users;',
      { type: QueryTypes.SELECT }
    );
    console.log(`✅ Users preserved: ${userCount[0].count} users still exist`);
    
    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('   - Database schema updated with new columns');
    console.log('   - All customer and transaction data cleared');
    console.log('   - Admin, manager, and operator users preserved');
    console.log('');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('--- Database connection closed ---');
  }
};

// Run if called directly
if (require.main === module) {
  migrateDatabase().catch(process.exit);
}

module.exports = { migrateDatabase }; 