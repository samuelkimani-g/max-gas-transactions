const bcrypt = require('bcryptjs');
const { User } = require('./models');
const { sequelize } = require('./config/database');

async function updateAdminCredentials() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Hash the new passwords
    const adminPassword = await bcrypt.hash('kimani@90', 10);
    const ownerPassword = await bcrypt.hash('maxgas1455', 10);

    // Update admin user
    const adminUser = await User.findOne({
      where: { username: 'admin' }
    });

    if (adminUser) {
      await adminUser.update({
        username: 'sammy',
        email: 'gichsammy4@gmail.com',
        password: adminPassword,
        fullName: 'Sammy'
      });
      console.log('✅ Admin user updated successfully');
      console.log('📧 Username: sammy');
      console.log('🔑 Password: kimani@90');
      console.log('📧 Email: gichsammy4@gmail.com');
    } else {
      console.log('❌ Admin user not found');
    }

    // Update owner user
    const ownerUser = await User.findOne({
      where: { username: 'owner' }
    });

    if (ownerUser) {
      await ownerUser.update({
        username: 'kamunyu',
        email: 'kamunyu.daniel@gmail.com',
        password: ownerPassword,
        fullName: 'Kamunyu'
      });
      console.log('✅ Owner user updated successfully');
      console.log('📧 Username: kamunyu');
      console.log('🔑 Password: maxgas1455');
      console.log('📧 Email: kamunyu.daniel@gmail.com');
    } else {
      console.log('❌ Owner user not found');
    }

    // Display updated users
    console.log('\n📋 Updated Admin Users:');
    console.log('=====================');
    
    const adminUsers = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id', 'username', 'email', 'fullName', 'role', 'status']
    });

    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Full Name: ${user.fullName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error updating admin credentials:', error);
  } finally {
    await sequelize.close();
  }
}

updateAdminCredentials(); 