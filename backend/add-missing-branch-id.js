const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_lvMj5ztu9dSq@ep-still-forest-a18968mz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function addMissingBranchId() {
  try {
    console.log('🔧 Adding missing branch_id columns...');
    
    // Add branch_id to customers table
    console.log('📝 Adding branch_id to customers table...');
    await pool.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id)
    `);
    console.log('✅ Added branch_id to customers table');
    
    // Add branch_id to transactions table
    console.log('📝 Adding branch_id to transactions table...');
    await pool.query(`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id)
    `);
    console.log('✅ Added branch_id to transactions table');
    
    // Create indexes for branch_id
    console.log('🔍 Creating indexes for branch_id...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON customers(branch_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_branch_id ON transactions(branch_id);
    `);
    console.log('✅ Created indexes for branch_id');
    
    // Update existing records to have branch_id = 1 (default branch)
    console.log('🔄 Updating existing records with default branch_id...');
    await pool.query(`
      UPDATE customers SET branch_id = 1 WHERE branch_id IS NULL
    `);
    await pool.query(`
      UPDATE transactions SET branch_id = 1 WHERE branch_id IS NULL
    `);
    console.log('✅ Updated existing records with default branch_id');
    
    console.log('\n🎉 Successfully added missing branch_id columns!');
    console.log('📊 All tables now have proper branch_id references');
    
  } catch (error) {
    console.error('❌ Error adding branch_id columns:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

addMissingBranchId(); 