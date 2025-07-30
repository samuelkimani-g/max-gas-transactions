const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupTrustedDevices() {
  try {
    console.log('Setting up trusted_devices table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS trusted_devices (
        id SERIAL PRIMARY KEY,
        device_identifier VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'operator')),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        last_accessed_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id),
        notes TEXT
      );
    `;

    // Create indexes for better performance
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_trusted_devices_device_identifier ON trusted_devices(device_identifier);
      CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
      CREATE INDEX IF NOT EXISTS idx_trusted_devices_is_active ON trusted_devices(is_active);
      CREATE INDEX IF NOT EXISTS idx_trusted_devices_last_accessed ON trusted_devices(last_accessed_at);
    `;

    await pool.query(createTableSQL);
    await pool.query(createIndexesSQL);
    
    console.log('✅ trusted_devices table created successfully!');
    console.log('✅ Indexes created for optimal performance');
    
  } catch (error) {
    console.error('❌ Error setting up trusted_devices table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupTrustedDevices()
    .then(() => {
      console.log('Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupTrustedDevices }; 