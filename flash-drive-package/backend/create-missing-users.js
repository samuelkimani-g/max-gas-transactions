const { sequelize } = require('./config/database');
const User = require('./models/User');
const Branch = require('./models/Branch');

async function createMissingUsers() {
  try {
    console.log('🔍 Checking for missing users...');
    
    // Check if manager1 exists
    let managerUser = await User.findOne({
      where: { email: 'manager1@maxgas.com' }
    });
    
    if (!managerUser) {
      console.log('📝 Creating manager1 user...');
      const branch = await Branch.findOne({ where: { name: 'Ikeja Branch' } });
      managerUser = await User.create({
        username: 'manager1',
        email: 'manager1@maxgas.com',
        password: 'manager123',
        fullName: 'Jane Smith',
        role: 'manager',
        branchId: branch ? branch.id : 1,
        permissions: ['customers:read', 'customers:create', 'customers:update', 'transactions:read', 'transactions:create', 'transactions:update', 'reports:generate'],
        status: 'active'
      });
      console.log('✅ Created manager1 user');
    } else {
      console.log('✅ manager1 user already exists');
    }
    
    // Check if operator1 exists
    let operatorUser = await User.findOne({
      where: { email: 'operator1@maxgas.com' }
    });
    
    if (!operatorUser) {
      console.log('📝 Creating operator1 user...');
      const branch = await Branch.findOne({ where: { name: 'Victoria Island Branch' } });
      operatorUser = await User.create({
        username: 'operator1',
        email: 'operator1@maxgas.com',
        password: 'operator123',
        fullName: 'Michael Brown',
        role: 'operator',
        branchId: branch ? branch.id : 1,
        permissions: ['customers:read', 'transactions:read', 'transactions:create'],
        status: 'active'
      });
      console.log('✅ Created operator1 user');
    } else {
      console.log('✅ operator1 user already exists');
    }
    
    console.log('🎉 All users are ready!');
    console.log('\n🔑 Login credentials:');
    console.log('Admin: admin@maxgas.com / admin123');
    console.log('Owner: owner@maxgas.com / admin123');
    console.log('Manager: manager1@maxgas.com / manager123');
    console.log('Operator: operator1@maxgas.com / operator123');
    
  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await sequelize.close();
  }
}

createMissingUsers(); 