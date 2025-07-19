const { sequelize } = require('../config/database');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Branch = require('../models/Branch');

async function cleanDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Delete all transactions first (due to foreign key constraints)
    console.log('🗑️  Deleting all transactions...');
    const deletedTransactions = await Transaction.destroy({
      where: {},
      force: true // This bypasses any soft delete if enabled
    });
    console.log(`✅ Deleted ${deletedTransactions} transactions`);

    // Delete all customers
    console.log('🗑️  Deleting all customers...');
    const deletedCustomers = await Customer.destroy({
      where: {},
      force: true // This bypasses any soft delete if enabled
    });
    console.log(`✅ Deleted ${deletedCustomers} customers`);

    // Delete all branches except the default one
    console.log('🗑️  Deleting all branches...');
    const deletedBranches = await Branch.destroy({
      where: {},
      force: true
    });
    console.log(`✅ Deleted ${deletedBranches} branches`);

    // Create a default branch
    console.log('🏢 Creating default branch...');
    const defaultBranch = await Branch.create({
      name: 'Main Branch',
      type: 'retail',
      address: 'Main Office',
      city: 'Nairobi',
      state: 'Nairobi',
      zipCode: '00100',
      country: 'Kenya',
      phone: '+254700000000',
      email: 'main@maxgas.com',
      manager: 'System Admin',
      status: 'active',
      description: 'Main branch office',
      capacity: '1000 cylinders',
      openingHours: '8:00 AM - 6:00 PM',
      timezone: 'Africa/Nairobi'
    });
    console.log(`✅ Created default branch: ${defaultBranch.name}`);

    // Keep users but show count
    const userCount = await User.count();
    console.log(`ℹ️  Keeping ${userCount} users (admin, manager, operator)`);

    console.log('');
    console.log('🎉 Database cleanup completed!');
    console.log('📊 Current database state:');
    console.log(`   - Customers: 0`);
    console.log(`   - Transactions: 0`);
    console.log(`   - Branches: 1 (default)`);
    console.log(`   - Users: ${userCount} (preserved)`);
    console.log('');
    console.log('✨ Ready for fresh testing!');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the cleanup
cleanDatabase(); 