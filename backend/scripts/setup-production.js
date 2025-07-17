const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Branch = require('../models/Branch');
const Payment = require('../models/Payment');
const PendingApproval = require('../models/PendingApproval');
const Analytics = require('../models/Analytics');
const Forecast = require('../models/Forecast');

async function setupProductionDatabase() {
  try {
    console.log('🚀 Starting production database setup...');
    
    // Sync all models
    await sequelize.sync({ force: false });
    console.log('✅ Database synced successfully');

    // Create default admin user if not exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        email: 'admin@gascylinder.com',
        password: hashedPassword,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true
      });
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create default manager user if not exists
    const managerExists = await User.findOne({ where: { role: 'manager' } });
    if (!managerExists) {
      const hashedPassword = await bcrypt.hash('manager123', 10);
      await User.create({
        username: 'manager',
        email: 'manager@gascylinder.com',
        password: hashedPassword,
        role: 'manager',
        firstName: 'Manager',
        lastName: 'User',
        isActive: true
      });
      console.log('✅ Default manager user created (username: manager, password: manager123)');
    } else {
      console.log('ℹ️ Manager user already exists');
    }

    // Create default operator user if not exists
    const operatorExists = await User.findOne({ where: { role: 'operator' } });
    if (!operatorExists) {
      const hashedPassword = await bcrypt.hash('operator123', 10);
      await User.create({
        username: 'operator',
        email: 'operator@gascylinder.com',
        password: hashedPassword,
        role: 'operator',
        firstName: 'Operator',
        lastName: 'User',
        isActive: true
      });
      console.log('✅ Default operator user created (username: operator, password: operator123)');
    } else {
      console.log('ℹ️ Operator user already exists');
    }

    // Create default branch if not exists
    const branchExists = await Branch.findOne({ where: { name: 'Main Branch' } });
    if (!branchExists) {
      await Branch.create({
        name: 'Main Branch',
        address: '123 Main Street, City, State',
        phone: '+1234567890',
        email: 'main@gascylinder.com',
        isActive: true
      });
      console.log('✅ Default branch created');
    } else {
      console.log('ℹ️ Default branch already exists');
    }

    console.log('✅ Production database setup complete!');
    console.log('\n📋 Default Login Credentials:');
    console.log('Admin: username=admin, password=admin123');
    console.log('Manager: username=manager, password=manager123');
    console.log('Operator: username=operator, password=operator123');
    console.log('\n⚠️ IMPORTANT: Change these passwords after first login!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the setup
setupProductionDatabase(); 