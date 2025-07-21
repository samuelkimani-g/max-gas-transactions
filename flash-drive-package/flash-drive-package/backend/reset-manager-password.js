const { User } = require('./models');
const { sequelize } = require('./config/database');
const bcrypt = require('bcryptjs');

async function resetManagerPassword() {
  try {
    console.log('🔄 Resetting manager password...');
    
    // Find the manager user
    const manager = await User.findOne({
      where: {
        email: 'manager1@maxgas.com'
      }
    });

    if (!manager) {
      console.log('❌ Manager user not found');
      return;
    }

    console.log('👤 Manager found:');
    console.log('  Username:', manager.username);
    console.log('  Email:', manager.email);

    // Set the password to exactly what we want
    const newPassword = 'manager123';
    console.log('\n🔐 Setting new password...');
    console.log('  New password:', newPassword);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('  New hash:', hashedPassword);
    
    // Update the user's password directly in the database
    await sequelize.query(
      'UPDATE users SET password = ? WHERE email = ?',
      {
        replacements: [hashedPassword, 'manager1@maxgas.com']
      }
    );

    console.log('\n✅ Password reset successfully!');
    
    // Test the password
    console.log('\n🧪 Testing reset password...');
    const isMatch = await bcrypt.compare(newPassword, hashedPassword);
    console.log('  Password match:', isMatch);
    
    if (isMatch) {
      console.log('🎉 Manager password is now working correctly!');
      console.log('\n📝 Login credentials:');
      console.log('  Email: manager1@maxgas.com');
      console.log('  Password: manager123');
    } else {
      console.log('❌ Password still not working');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

resetManagerPassword().then(() => {
  console.log('\n🎉 Reset complete');
  process.exit(0);
}); 