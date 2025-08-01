const { sequelize } = require('./config/database');
const { User, Branch, Customer, Transaction, Forecast, Analytics, Payment, PendingApproval } = require('./models');

async function resetDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('\n🔄 Resetting database...');

    // Drop all tables in the correct order (respecting foreign keys)
    console.log('🗑️ Dropping all tables...');
    
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    
    // Drop tables in reverse dependency order
    const tablesToDrop = [
      'pending_approvals',
      'payments', 
      'analytics',
      'forecasts',
      'transactions',
      'customers',
      'users',
      'branches'
    ];

    for (const table of tablesToDrop) {
      try {
        console.log(`🗑️ Dropping table: ${table}`);
        await sequelize.query(`DROP TABLE IF EXISTS "${table}";`);
      } catch (error) {
        console.log(`⚠️ Could not drop ${table}:`, error.message);
      }
    }

    await sequelize.query('PRAGMA foreign_keys = ON;');

    console.log('\n🔧 Recreating tables...');
    
    // Sync all models to recreate tables
    await sequelize.sync({ force: true });
    
    console.log('✅ Tables recreated successfully!');

    console.log('\n📋 Available tables:');
    const [tables] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
    `);
    
    tables.forEach(table => {
      console.log(`- ${table.name}`);
    });

    console.log('\n🎯 Database has been completely reset!');
    console.log('All data cleared and tables recreated fresh.');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await sequelize.close();
  }
}

resetDatabase(); 