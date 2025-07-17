const { sequelize } = require('../config/database');
const { seedInitialData } = require('../seeders/initial-data');

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');

    // Test database connection
    console.log('📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Sync database (create tables) - Use force: true to recreate all tables
    console.log('🗄️ Creating database tables...');
    await sequelize.sync({ force: true }); // This will drop existing tables and recreate them
    console.log('✅ Database tables created');

    // Seed initial data
    console.log('🌱 Seeding initial data...');
    await seedInitialData();

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Access the API at: http://localhost:5000');
    console.log('3. Use the default credentials to login');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 