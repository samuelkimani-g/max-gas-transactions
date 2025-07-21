const { sequelize } = require('../config/database');
const { User, Customer, Transaction, Branch, Forecast, Analytics, Payment } = require('../models');

async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync all models (create tables)
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database models synchronized.');
    
    // Create default admin user if it doesn't exist
    const adminExists = await User.findOne({ where: { email: 'admin@gascylinder.com' } });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@gascylinder.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'admin'
      });
      console.log('✅ Default admin user created (email: admin@gascylinder.com, password: password)');
    }
    
    // Create default branch if it doesn't exist
    const branchExists = await Branch.findOne({ where: { name: 'Main Branch' } });
    if (!branchExists) {
      await Branch.create({
        name: 'Main Branch',
        location: 'Mombasa, Kenya',
        contact: '+254700000000',
        email: 'main@gascylinder.com'
      });
      console.log('✅ Default branch created');
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run seed (to add sample data)');
    console.log('2. Start the server: npm run dev');
    console.log('3. Access the application at: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase; 