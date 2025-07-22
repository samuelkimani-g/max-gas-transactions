const { Sequelize, QueryTypes } = require('sequelize');

// Production database connection
const sequelize = new Sequelize(process.env.DATABASE_URL || 'your-production-database-url', {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function migrate() {
  try {
    console.log('🔧 Starting database migration...');
    console.log('🌍 Connecting to production database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Add missing columns to customers table
    console.log('📝 Adding missing columns to customers table...');
    await sequelize.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS financial_balance DECIMAL(10,2) DEFAULT 0;');
    await sequelize.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS cylinder_balance INTEGER DEFAULT 0;');
    await sequelize.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS cylinder_balance_6kg INTEGER DEFAULT 0;');
    await sequelize.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS cylinder_balance_13kg INTEGER DEFAULT 0;');
    await sequelize.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS cylinder_balance_50kg INTEGER DEFAULT 0;');
    console.log('✅ Customer table columns added');
    
    // Add missing columns to transactions table
    console.log('📝 Adding missing columns to transactions table...');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_number VARCHAR(20);');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS load_6kg INTEGER DEFAULT 0;');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS load_13kg INTEGER DEFAULT 0;');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS load_50kg INTEGER DEFAULT 0;');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS returns_breakdown JSONB;');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS outright_breakdown JSONB;');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_returns INTEGER DEFAULT 0;');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_load INTEGER DEFAULT 0;');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cylinder_balance_6kg INTEGER DEFAULT 0;');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cylinder_balance_13kg INTEGER DEFAULT 0;');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cylinder_balance_50kg INTEGER DEFAULT 0;');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cylinder_balance INTEGER DEFAULT 0;');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS financial_balance DECIMAL(10,2) DEFAULT 0;');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_bill DECIMAL(10,2) DEFAULT 0;');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT \'cash\';');
    await sequelize.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT;');
    console.log('✅ Transaction table columns added');
    
    // Create unique index on transaction_number
    console.log('📝 Creating unique index on transaction_number...');
    try {
      await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS transactions_transaction_number_unique ON transactions(transaction_number);');
      console.log('✅ Unique index created on transaction_number');
    } catch (e) {
      console.log('ℹ️ Index already exists or not needed');
    }
    
    // Generate transaction numbers for existing transactions
    console.log('📝 Generating transaction numbers for existing transactions...');
    const transactions = await sequelize.query('SELECT id FROM transactions WHERE transaction_number IS NULL ORDER BY id;', { type: QueryTypes.SELECT });
    
    console.log(`Found ${transactions.length} transactions without transaction numbers`);
    
    for (let i = 0; i < transactions.length; i++) {
      const transactionNumber = 'A' + String(i + 1).padStart(4, '0');
      await sequelize.query('UPDATE transactions SET transaction_number = ? WHERE id = ?;', {
        replacements: [transactionNumber, transactions[i].id],
        type: QueryTypes.UPDATE
      });
      console.log(`Generated transaction number ${transactionNumber} for transaction ID ${transactions[i].id}`);
    }
    
    console.log(`✅ Generated transaction numbers for ${transactions.length} existing transactions`);
    console.log('🎉 Migration completed successfully!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run migration
migrate(); 