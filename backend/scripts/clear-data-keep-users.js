// backend/scripts/clear-data-keep-users.js
const { sequelize } = require('../config/database');

const clearDataKeepUsers = async () => {
  console.log('--- Starting Data Cleanup (Preserving Users) ---');
  console.log('This will delete all customers and transactions but keep admin, manager, and operator users.');
  
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Connected to database successfully');

    // Start a transaction to ensure data consistency
    const transaction = await sequelize.transaction();

    try {
      // Delete all transactions first (due to foreign key constraints)
      const deletedTransactions = await sequelize.query(`
        DELETE FROM transactions;
      `, { transaction });
      console.log('🗑️ Deleted all transactions');

      // Delete all customers
      const deletedCustomers = await sequelize.query(`
        DELETE FROM customers;
      `, { transaction });
      console.log('🗑️ Deleted all customers');

      // Delete all pending approvals
      await sequelize.query(`
        DELETE FROM pending_approvals;
      `, { transaction });
      console.log('🗑️ Deleted all pending approvals');

      // Reset auto-increment sequences
      await sequelize.query(`
        ALTER SEQUENCE customers_id_seq RESTART WITH 1;
        ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
        ALTER SEQUENCE pending_approvals_id_seq RESTART WITH 1;
      `, { transaction });
      console.log('🔄 Reset ID sequences');

      // Commit the transaction
      await transaction.commit();
      console.log('✅ Data cleanup completed successfully!');
      console.log('👥 Users (admin, manager, operator) have been preserved.');
      
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error during data cleanup:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('--- Database connection closed ---');
  }
};

// Run cleanup if this script is executed directly
if (require.main === module) {
  clearDataKeepUsers().catch(console.error);
}

module.exports = { clearDataKeepUsers }; 