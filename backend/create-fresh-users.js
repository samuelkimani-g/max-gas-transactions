const bcrypt = require('bcryptjs');
const { User, Branch } = require('./models');
const { sequelize } = require('./config/database');

async function createFreshUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('\n👥 Creating fresh users...');

    // Create a default branch first
    const defaultBranch = await Branch.create({
      name: 'Main Branch',
      type: 'main',
      address: '123 Main Street',
      city: 'Nairobi',
      state: 'Nairobi',
      country: 'Kenya',
      phone: '+254700000000',
      email: 'main@maxgas.com',
      status: 'active',
      manager: 'Sammy Gichuru'
    });

    console.log('✅ Default branch created');

    // Create users with correct passwords
    const users = [
      {
        username: 'sammy',
        email: 'gichsammy4@gmail.com',
        password: 'kimani@90',
        fullName: 'Sammy Gichuru',
        role: 'admin',
        status: 'active',
        branchId: defaultBranch.id
      },
      {
        username: 'kamunyu',
        email: 'kamunyu.daniel@gmail.com',
        password: 'maxgas1455',
        fullName: 'Daniel Kamunyu',
        role: 'admin',
        status: 'active',
        branchId: defaultBranch.id
      },
      {
        username: 'manager1',
        email: 'manager1@maxgas.com',
        password: 'manager123',
        fullName: 'John Manager',
        role: 'manager',
        status: 'active',
        branchId: defaultBranch.id
      },
      {
        username: 'operator1',
        email: 'operator1@maxgas.com',
        password: 'operator123',
        fullName: 'Jane Operator',
        role: 'operator',
        status: 'active',
        branchId: defaultBranch.id
      }
    ];

    for (const userData of users) {
      const { password, ...userInfo } = userData;
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user with hashed password
      const user = await User.create({
        ...userInfo,
        password: hashedPassword
      });

      console.log(`✅ Created user: ${user.username} (${user.role})`);
      
      // Test the password
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`   Password test: ${isValid ? '✅' : '❌'}`);
    }

    console.log('\n🎯 All users created successfully!');
    console.log('\n📋 Available login credentials:');
    console.log('- sammy / kimani@90 (Admin)');
    console.log('- kamunyu / maxgas1455 (Admin)');
    console.log('- manager1 / manager123 (Manager)');
    console.log('- operator1 / operator123 (Operator)');

  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await sequelize.close();
  }
}

createFreshUsers(); 