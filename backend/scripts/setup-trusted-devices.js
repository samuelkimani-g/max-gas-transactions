const { sequelize } = require('../config/database');

async function setupTrustedDevices() {
  try {
    console.log('🔧 Setting up trusted devices table...');

    // Create trusted_devices table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS trusted_devices (
        id SERIAL PRIMARY KEY,
        device_identifier VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'operator')),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        last_accessed_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER,
        notes TEXT
      );
    `);

    // Create indexes for performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_trusted_devices_identifier ON trusted_devices(device_identifier);
      CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
      CREATE INDEX IF NOT EXISTS idx_trusted_devices_active ON trusted_devices(is_active);
      CREATE INDEX IF NOT EXISTS idx_trusted_devices_last_accessed ON trusted_devices(last_accessed_at);
    `);

    console.log('✅ Trusted devices table setup completed successfully');

    // Check if we have any admin users to create a sample trusted device
    const adminUsers = await sequelize.query(`
      SELECT id, username, role FROM users WHERE role = 'admin' LIMIT 1
    `);

    if (adminUsers[0].length > 0) {
      console.log('📋 Found admin users, trusted devices table is ready for use');
    } else {
      console.log('⚠️ No admin users found. Please create admin users first.');
    }

  } catch (error) {
    console.log('⚠️ Trusted devices table setup had issues, but continuing...', error.message);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupTrustedDevices()
    .then(() => {
      console.log('✅ Trusted devices setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Trusted devices setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupTrustedDevices }; 