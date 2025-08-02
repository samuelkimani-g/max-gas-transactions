const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_lvMj5ztu9dSq@ep-still-forest-a18968mz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function createDevicesTable() {
  try {
    console.log('🔧 Creating devices table...');
    
    // Create devices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        device_identifier VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id),
        device_name VARCHAR(255),
        platform VARCHAR(100),
        user_agent TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        is_trusted BOOLEAN DEFAULT FALSE,
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    console.log('✅ Devices table created successfully!');
    
    // Create device_approvals table for managing device approvals
    await pool.query(`
      CREATE TABLE IF NOT EXISTS device_approvals (
        id SERIAL PRIMARY KEY,
        device_identifier VARCHAR(255) NOT NULL,
        requested_by_user_id INTEGER REFERENCES users(id),
        approved_by_user_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    console.log('✅ Device approvals table created successfully!');
    
    // Add some sample device data
    const sampleDevices = [
      {
        device_identifier: 'dc94e35d-12fe-4ff1-a0a1-f8231827914f',
        user_id: 6, // sammy
        device_name: 'Chrome Browser',
        platform: 'Windows',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        status: 'trusted',
        is_trusted: true
      }
    ];
    
    console.log('📱 Adding sample device data...');
    for (const device of sampleDevices) {
      await pool.query(`
        INSERT INTO devices (device_identifier, user_id, device_name, platform, user_agent, status, is_trusted)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (device_identifier) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          device_name = EXCLUDED.device_name,
          platform = EXCLUDED.platform,
          user_agent = EXCLUDED.user_agent,
          status = EXCLUDED.status,
          is_trusted = EXCLUDED.is_trusted,
          updated_at = NOW()
      `, [device.device_identifier, device.user_id, device.device_name, device.platform, device.user_agent, device.status, device.is_trusted]);
    }
    
    console.log('✅ Sample device data added!');
    console.log('\n🎉 Device management tables created successfully!');
    console.log('📱 You can now use device management features');
    
  } catch (error) {
    console.error('❌ Error creating devices table:', error.message);
  } finally {
    await pool.end();
  }
}

createDevicesTable(); 