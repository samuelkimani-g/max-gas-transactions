const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_lvMj5ztu9dSq@ep-still-forest-a18968mz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function resetDatabase() {
  try {
    console.log('🗑️ Clearing database...');
    
    // Drop all tables in the correct order (respecting foreign keys)
    await pool.query('DROP TABLE IF EXISTS transactions CASCADE');
    await pool.query('DROP TABLE IF EXISTS customers CASCADE');
    await pool.query('DROP TABLE IF EXISTS payments CASCADE');
    await pool.query('DROP TABLE IF EXISTS pending_approvals CASCADE');
    await pool.query('DROP TABLE IF EXISTS forecasts CASCADE');
    await pool.query('DROP TABLE IF EXISTS analytics CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    await pool.query('DROP TABLE IF EXISTS branches CASCADE');
    
    console.log('✅ All tables dropped successfully!');
    
    // Recreate tables
    console.log('🔧 Recreating tables...');
    
    // Create branches table
    await pool.query(`
      CREATE TABLE branches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create users table
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'operator')),
        email VARCHAR(255),
        branch_id INTEGER REFERENCES branches(id),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create customers table
    await pool.query(`
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        branch_id INTEGER REFERENCES branches(id),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create transactions table
    await pool.query(`
      CREATE TABLE transactions (
        id SERIAL PRIMARY KEY,
        transaction_number VARCHAR(20) UNIQUE,
        customer_id INTEGER REFERENCES customers(id),
        user_id INTEGER REFERENCES users(id),
        date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        total DECIMAL(10,2) NOT NULL,
        paid DECIMAL(10,2) NOT NULL,
        balance DECIMAL(10,2) NOT NULL,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'completed',
        payment_method VARCHAR(50) DEFAULT 'cash',
        invoice_number VARCHAR(50),
        reference VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create payments table
    await pool.query(`
      CREATE TABLE payments (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER REFERENCES transactions(id),
        amount DECIMAL(10,2) NOT NULL,
        payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        payment_method VARCHAR(50) DEFAULT 'cash',
        reference VARCHAR(100),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create pending_approvals table
    await pool.query(`
      CREATE TABLE pending_approvals (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        requested_by INTEGER REFERENCES users(id),
        approved_by INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    console.log('✅ Tables recreated successfully!');
    
    // Create default branch
    console.log('🏢 Creating default branch...');
    const branchResult = await pool.query(`
      INSERT INTO branches (name, location) 
      VALUES ('Main Branch', 'Nairobi, Kenya') 
      RETURNING id
    `);
    const branchId = branchResult.rows[0].id;
    console.log('✅ Default branch created with ID:', branchId);
    
    // Create new users with specified credentials
    console.log('👥 Creating new users...');
    
    const users = [
      {
        username: 'admin',
        password: 'maxgas1455',
        role: 'admin',
        email: 'admin@maxgas.com'
      },
      {
        username: 'manager',
        password: 'maxmanager',
        role: 'manager',
        email: 'manager@maxgas.com'
      },
      {
        username: 'operator',
        password: 'operator123',
        role: 'operator',
        email: 'operator@maxgas.com'
      }
    ];
    
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await pool.query(`
        INSERT INTO users (username, password, role, email, branch_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [user.username, hashedPassword, user.role, user.email, branchId]);
      
      console.log(`✅ Created ${user.role}: ${user.username}`);
    }
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('\n📋 New Login Credentials:');
    console.log('👑 Admin: admin / maxgas1455');
    console.log('👔 Manager: manager / maxmanager');
    console.log('👷 Operator: operator / operator123');
    console.log('\n💡 All users are active and ready to use!');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
  } finally {
    await pool.end();
  }
}

resetDatabase(); 