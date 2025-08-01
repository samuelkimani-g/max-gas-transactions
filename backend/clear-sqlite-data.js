const { sequelize } = require('./config/database');

async function clearSQLiteData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('\n🗑️ Clearing all data from SQLite database...');

    // Get all table names for SQLite
    const [tables] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
    `);

    console.log('📋 Found tables:', tables.map(t => t.name));

    // Clear all tables
    for (const table of tables) {
      const tableName = table.name;
      console.log(`🗑️ Clearing table: ${tableName}`);
      
      // Delete all records from the table
      await sequelize.query(`DELETE FROM "${tableName}";`);
      
      // Reset the auto-increment counter
      await sequelize.query(`DELETE FROM sqlite_sequence WHERE name='${tableName}';`);
    }

    console.log('\n✅ All data cleared successfully!');
    console.log('\n📋 Tables cleared:');
    tables.forEach(table => {
      console.log(`- ${table.name}`);
    });

    console.log('\n🎯 Database is now clean and ready for fresh data!');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await sequelize.close();
  }
}

clearSQLiteData(); 