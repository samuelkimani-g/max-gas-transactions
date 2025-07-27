const { sequelize } = require('../config/database');

async function setupPayments() {
  try {
    console.log('🔧 Setting up payments table...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Create payments table
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
    
    console.log('✅ Payments table created successfully');
    
    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
      CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
    `);
    
    console.log('✅ Payment indexes created successfully');
    
    console.log('🎉 Payments setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up payments:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run setup
setupPayments()
  .then(() => {
    console.log('✅ Setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }); 