const bcrypt = require('bcryptjs');
const { User } = require('./models');
const { sequelize } = require('./config/database');

async function resetAdminPassword() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Hash the new password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Update admin user password
    const adminUser = await User.findOne({
      where: { username: 'admin' }
    });

    if (adminUser) {
      await adminUser.update({
        password: hashedPassword
      });
      console.log('✅ Admin password reset successfully');
      console.log('📧 Username: admin');
      console.log('🔑 Password: admin123');
    } else {
      // Create admin user if it doesn't exist
      await User.create({
        username: 'admin',
        email: 'admin@maxgas.com',
        password: hashedPassword,
        fullName: 'System Administrator',
        role: 'admin',
        permissions: ['all'],
        status: 'active'
      });
      console.log('✅ Admin user created successfully');
      console.log('📧 Username: admin');
      console.log('🔑 Password: admin123');
    }

  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
  } finally {
    await sequelize.close();
  }
}

resetAdminPassword(); 