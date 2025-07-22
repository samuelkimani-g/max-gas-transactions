const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function clearDatabase() {
  try {
    console.log('🧹 Starting database cleanup (keeping users)...');
    
    // First, delete all transactions (they reference customers)
    console.log('📝 Deleting all transactions...');
    const deletedTransactions = await sequelize.query('DELETE FROM transactions;', { type: QueryTypes.DELETE });
    console.log(`Deleted ${deletedTransactions[1]} transactions`);
    
    // Then delete all customers
    console.log('📝 Deleting all customers...');
    const deletedCustomers = await sequelize.query('DELETE FROM customers;', { type: QueryTypes.DELETE });
    console.log(`Deleted ${deletedCustomers[1]} customers`);
    
    // Reset the ID sequences to start from 1 again
    console.log('📝 Resetting ID sequences...');
    try {
      await sequelize.query('ALTER SEQUENCE customers_id_seq RESTART WITH 1;', { type: QueryTypes.RAW });
      await sequelize.query('ALTER SEQUENCE transactions_id_seq RESTART WITH 1;', { type: QueryTypes.RAW });
      console.log('✅ Sequences reset successfully');
    } catch (e) {
      console.log('ℹ️ Sequence reset not needed (SQLite or already reset)');
    }
    
    // Verify users are still there
    console.log('📝 Checking users...');
    const users = await sequelize.query('SELECT username, role FROM users ORDER BY username;', { type: QueryTypes.SELECT });
    console.log('👥 Remaining users:');
    users.forEach(user => console.log(`  - ${user.username} (${user.role})`));
    
    console.log('✅ Database cleanup completed successfully!');
    console.log('🎉 All customer and transaction data cleared, users preserved!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    console.error('Full error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  clearDatabase();
}

module.exports = clearDatabase; 