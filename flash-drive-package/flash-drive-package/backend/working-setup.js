const bcrypt = require('bcryptjs');
const { User, Branch } = require('./models');
const { sequelize } = require('./config/database');

async function workingSetup() {
  try {
    console.log('🚀 Creating working database setup...');
    
    // Drop and recreate all tables
    console.log('🗄️ Recreating database...');
    await sequelize.sync({ force: true });
    console.log('✅ Database recreated');
    
    // Create main branch
    console.log('🏢 Creating main branch...');
    const mainBranch = await Branch.create({
      name: 'Main Branch',
      type: 'main',
      address: '123 Main Street, Lagos',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      phone: '+2348012345678',
      email: 'main@maxgas.com',
      manager: 'John Doe',
      status: 'active',
      description: 'Main headquarters and primary distribution center',
      openingHours: 'Monday - Saturday: 8:00 AM - 6:00 PM',
      timezone: 'Africa/Lagos'
    });
    console.log('✅ Main branch created');

    // Create users using Sequelize models (let the hooks handle password hashing)
    console.log('👥 Creating users...');
    
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@maxgas.com',
      password: 'admin123', // This will be hashed by the beforeCreate hook
      fullName: 'System Administrator',
      role: 'admin',
      branchId: mainBranch.id,
      permissions: ['all'],
      status: 'active'
    });

    const ownerUser = await User.create({
      username: 'owner',
      email: 'owner@maxgas.com',
      password: 'owner123',
      fullName: 'Business Owner',
      role: 'admin',
      branchId: mainBranch.id,
      permissions: ['all'],
      status: 'active'
    });

    const managerUser = await User.create({
      username: 'manager1',
      email: 'manager1@maxgas.com',
      password: 'manager123',
      fullName: 'Jane Smith',
      role: 'manager',
      branchId: mainBranch.id,
      permissions: ['customers', 'transactions', 'reports'],
      status: 'active'
    });

    const operatorUser = await User.create({
      username: 'operator1',
      email: 'operator1@maxgas.com',
      password: 'operator123',
      fullName: 'Michael Brown',
      role: 'operator',
      branchId: mainBranch.id,
      permissions: ['customers', 'transactions'],
      status: 'active'
    });
    
    console.log('✅ All users created');

    // Test login functionality
    console.log('\n🔐 Testing login functionality...');
    
    // Test password comparison
    const isMatch = await adminUser.comparePassword('admin123');
    console.log(`Admin password test: ${isMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (!isMatch) {
      console.log('❌ Password test failed. Checking password hash...');
      console.log(`Password hash: ${adminUser.password.substring(0, 30)}...`);
      
      // Try manual comparison
      const manualMatch = await bcrypt.compare('admin123', adminUser.password);
      console.log(`Manual comparison: ${manualMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
    }

    // Count users
    const userCount = await User.count();
    console.log(`📊 Total users created: ${userCount}`);

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n🔑 Login credentials:');
    console.log('Admin 1: admin@maxgas.com / admin123');
    console.log('Admin 2: owner@maxgas.com / owner123');
    console.log('Manager: manager1@maxgas.com / manager123');
    console.log('Operator: operator1@maxgas.com / operator123');
    
    console.log('\n📋 Next steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Test login in the frontend');
    console.log('3. Access the API at: http://localhost:5000');

  } catch (error) {
    console.error('❌ Setup error:', error);
    process.exit(1);
  }
}

workingSetup(); 