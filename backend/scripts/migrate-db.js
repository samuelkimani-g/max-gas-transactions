const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function migrate() {
  try {
    console.log('🔧 Starting database migration...');
    console.log('🌍 Connecting to database...');
    
    // Test connection with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        break;
      } catch (error) {
        retries--;
        console.log(`⚠️ Database connection failed, ${retries} retries left...`);
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Add missing columns to customers table
    console.log('📝 Adding missing columns to customers table...');
    const customerColumns = [
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS financial_balance DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS cylinder_balance INTEGER DEFAULT 0',
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS cylinder_balance_6kg INTEGER DEFAULT 0',
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS cylinder_balance_13kg INTEGER DEFAULT 0',
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS cylinder_balance_50kg INTEGER DEFAULT 0'
    ];
    
    for (const sql of customerColumns) {
      try {
        await sequelize.query(sql + ';');
        console.log(`✅ ${sql.split(' ')[5]} added`);
      } catch (error) {
        console.log(`ℹ️ ${sql.split(' ')[5]} already exists or error:`, error.message);
      }
    }
    
    // Add missing columns to transactions table
    console.log('📝 Adding missing columns to transactions table...');
    const transactionColumns = [
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_number VARCHAR(20)',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS load_6kg INTEGER DEFAULT 0',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS load_13kg INTEGER DEFAULT 0',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS load_50kg INTEGER DEFAULT 0',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS returns_breakdown JSONB',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS outright_breakdown JSONB',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_returns INTEGER DEFAULT 0',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_load INTEGER DEFAULT 0',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cylinder_balance_6kg INTEGER DEFAULT 0',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cylinder_balance_13kg INTEGER DEFAULT 0',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cylinder_balance_50kg INTEGER DEFAULT 0',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cylinder_balance INTEGER DEFAULT 0',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS financial_balance DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_bill DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT \'cash\'',
      'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT'
    ];
    
    for (const sql of transactionColumns) {
      try {
        await sequelize.query(sql + ';');
        console.log(`✅ ${sql.split(' ')[5]} added`);
      } catch (error) {
        console.log(`ℹ️ ${sql.split(' ')[5]} already exists or error:`, error.message);
      }
    }
    
    // Create unique index on transaction_number
    console.log('📝 Creating unique index on transaction_number...');
    try {
      await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS transactions_transaction_number_unique ON transactions(transaction_number);');
      console.log('✅ Unique index created on transaction_number');
    } catch (error) {
      console.log('ℹ️ Index already exists:', error.message);
    }
    
    // Generate transaction numbers for existing transactions
    console.log('📝 Generating transaction numbers for existing transactions...');
    try {
      const transactions = await sequelize.query('SELECT id FROM transactions WHERE transaction_number IS NULL ORDER BY id;', { type: QueryTypes.SELECT });
      
      console.log(`Found ${transactions.length} transactions without transaction numbers`);
      
      for (let i = 0; i < transactions.length; i++) {
        const transactionNumber = 'A' + String(i + 1).padStart(4, '0');
        await sequelize.query('UPDATE transactions SET transaction_number = ? WHERE id = ?;', {
          replacements: [transactionNumber, transactions[i].id],
          type: QueryTypes.UPDATE
        });
        console.log(`✅ Generated ${transactionNumber} for transaction ${transactions[i].id}`);
      }
      
      console.log(`✅ Generated transaction numbers for ${transactions.length} existing transactions`);
    } catch (error) {
      console.log('⚠️ Error generating transaction numbers:', error.message);
    }
    
    console.log('🎉 Migration completed successfully!');
    
    await sequelize.close();
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    try {
      await sequelize.close();
    } catch (closeError) {
      console.error('Error closing connection:', closeError.message);
    }
    return false;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = migrate; 