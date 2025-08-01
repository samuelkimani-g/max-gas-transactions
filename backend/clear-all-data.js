const { sequelize } = require('./config/database');

async function clearAllData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('\n🗑️ Clearing all data from database...');

    // Get all table names
    const [tables] = await sequelize.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%' 
      AND tablename NOT LIKE 'sql_%'
    `);

    console.log('📋 Found tables:', tables.map(t => t.tablename));

    // Disable foreign key checks temporarily
    await sequelize.query('SET session_replication_role = replica;');

    // Clear all tables
    for (const table of tables) {
      const tableName = table.tablename;
      console.log(`🗑️ Clearing table: ${tableName}`);
      await sequelize.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    }

    // Re-enable foreign key checks
    await sequelize.query('SET session_replication_role = DEFAULT;');

    console.log('\n✅ All data cleared successfully!');
    console.log('\n📋 Tables cleared:');
    tables.forEach(table => {
      console.log(`- ${table.tablename}`);
    });

    console.log('\n🎯 Database is now clean and ready for fresh data!');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await sequelize.close();
  }
}

clearAllData(); 