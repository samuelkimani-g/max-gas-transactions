const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/database');

async function updatePasswordsSimple() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('\n🔧 Updating passwords...');

    // Update sammy
    console.log('\n🔧 Updating sammy password...');
    const sammyHash = await bcrypt.hash('kimani@90', 12);
    await sequelize.query('UPDATE users SET password = ? WHERE username = ?', 
      { replacements: [sammyHash, 'sammy'] });
    console.log('✅ Sammy password updated');

    // Update kamunyu
    console.log('\n🔧 Updating kamunyu password...');
    const kamunyuHash = await bcrypt.hash('maxgas1455', 12);
    await sequelize.query('UPDATE users SET password = ? WHERE username = ?', 
      { replacements: [kamunyuHash, 'kamunyu'] });
    console.log('✅ Kamunyu password updated');

    // Update manager1
    console.log('\n🔧 Updating manager1 password...');
    const managerHash = await bcrypt.hash('manager123', 12);
    await sequelize.query('UPDATE users SET password = ? WHERE username = ?', 
      { replacements: [managerHash, 'manager1'] });
    console.log('✅ Manager1 password updated');

    // Update operator1
    console.log('\n🔧 Updating operator1 password...');
    const operatorHash = await bcrypt.hash('operator123', 12);
    await sequelize.query('UPDATE users SET password = ? WHERE username = ?', 
      { replacements: [operatorHash, 'operator1'] });
    console.log('✅ Operator1 password updated');

    console.log('\n🎯 All passwords updated!');
    console.log('\n📋 Login credentials:');
    console.log('- sammy / kimani@90 (Admin)');
    console.log('- kamunyu / maxgas1455 (Admin)');
    console.log('- manager1 / manager123 (Manager)');
    console.log('- operator1 / operator123 (Operator)');

  } catch (error) {
    console.error('❌ Error updating passwords:', error);
  } finally {
    await sequelize.close();
  }
}

updatePasswordsSimple(); 