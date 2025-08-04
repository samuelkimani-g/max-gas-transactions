const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_lvMj5ztu9dSq@ep-still-forest-a18968mz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function resetDatabase() {
  try {
    console.log('🗑️  Starting complete database reset...');
    
    // Drop all existing tables
    console.log('📋 Dropping existing tables...');
    await pool.query(`
      DROP TABLE IF EXISTS 
        pending_approvals,
        analytics,
        forecasts,
        payments,
        transactions,
        customers,
        users,
        branches
      CASCADE;
    `);
    
    console.log('✅ All tables dropped successfully!');
    
    // Create branches table
    console.log('🏢 Creating branches table...');
    await pool.query(`
      CREATE TABLE branches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) DEFAULT 'retail' CHECK (type IN ('main', 'retail', 'warehouse', 'distribution')),
        address VARCHAR(200) NOT NULL,
        city VARCHAR(50) NOT NULL,
        state VARCHAR(50) NOT NULL,
        zip_code VARCHAR(20),
        country VARCHAR(50) DEFAULT 'Nigeria',
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100),
        manager VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
        description TEXT,
        capacity VARCHAR(100),
        opening_hours VARCHAR(200),
        timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
        coordinates JSONB,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create users table
    console.log('👥 Creating users table...');
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'operator' CHECK (role IN ('admin', 'manager', 'operator')),
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        branch_id INTEGER REFERENCES branches(id),
        permissions JSONB DEFAULT '[]',
        last_login TIMESTAMP WITH TIME ZONE,
        phone VARCHAR(20),
        avatar VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create customers table
    console.log('👤 Creating customers table...');
    await pool.query(`
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(100),
        address TEXT,
        category VARCHAR(50) DEFAULT 'regular' CHECK (category IN ('regular', 'premium', 'wholesale', 'retail', 'sales_team')),
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        financial_balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
        cylinder_balance INTEGER DEFAULT 0,
        cylinder_balance_6kg INTEGER DEFAULT 0,
        cylinder_balance_13kg INTEGER DEFAULT 0,
        cylinder_balance_50kg INTEGER DEFAULT 0,
        notes TEXT,
        tags JSONB DEFAULT '[]',
        last_transaction_date TIMESTAMP WITH TIME ZONE,
        total_transactions INTEGER DEFAULT 0 NOT NULL,
        total_spent DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create transactions table
    console.log('💰 Creating transactions table...');
    await pool.query(`
      CREATE TABLE transactions (
        id SERIAL PRIMARY KEY,
        transaction_number VARCHAR(20) UNIQUE NOT NULL,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        load_6kg INTEGER DEFAULT 0,
        load_13kg INTEGER DEFAULT 0,
        load_50kg INTEGER DEFAULT 0,
        returns_breakdown JSONB DEFAULT '{}',
        outright_breakdown JSONB DEFAULT '{}',
        total_returns INTEGER DEFAULT 0,
        total_load INTEGER DEFAULT 0,
        cylinder_balance_6kg INTEGER DEFAULT 0,
        cylinder_balance_13kg INTEGER DEFAULT 0,
        cylinder_balance_50kg INTEGER DEFAULT 0,
        cylinder_balance INTEGER DEFAULT 0,
        financial_balance DECIMAL(10,2) DEFAULT 0.00,
        total_bill DECIMAL(10,2) DEFAULT 0.00,
        amount_paid DECIMAL(10,2) DEFAULT 0.00,
        payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mpesa', 'card', 'transfer', 'credit')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create payments table
    console.log('💳 Creating payments table...');
    await pool.query(`
      CREATE TABLE payments (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER NOT NULL REFERENCES transactions(id),
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'credit', 'mobile_money')),
        reference VARCHAR(100),
        receipt_number VARCHAR(50) UNIQUE,
        branch_id INTEGER REFERENCES branches(id),
        processed_by INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
        notes TEXT,
        payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create forecasts table
    console.log('📊 Creating forecasts table...');
    await pool.query(`
      CREATE TABLE forecasts (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL CHECK (type IN ('sales', 'demand', 'inventory', 'revenue')),
        period VARCHAR(50) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        forecast_data JSONB NOT NULL,
        historical_data JSONB NOT NULL,
        model_type VARCHAR(50) DEFAULT 'linear_regression',
        accuracy DECIMAL(5,4),
        confidence_level DECIMAL(3,2) DEFAULT 0.95,
        branch_id INTEGER REFERENCES branches(id),
        created_by INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create analytics table
    console.log('📈 Creating analytics table...');
    await pool.query(`
      CREATE TABLE analytics (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        data JSONB NOT NULL,
        branch_id INTEGER REFERENCES branches(id),
        generated_by INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'generated' CHECK (status IN ('generated', 'processing', 'failed')),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create pending_approvals table
    console.log('⏳ Creating pending_approvals table...');
    await pool.query(`
      CREATE TABLE pending_approvals (
        id SERIAL PRIMARY KEY,
        request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('customer_edit', 'customer_delete', 'transaction_edit', 'transaction_delete')),
        entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('customer', 'transaction')),
        entity_id INTEGER NOT NULL,
        requested_by INTEGER NOT NULL REFERENCES users(id),
        approved_by INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        original_data JSONB NOT NULL,
        requested_changes JSONB NOT NULL,
        reason TEXT,
        manager_notes TEXT,
        processed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    console.log('✅ All tables created successfully!');
    
    // Create indexes
    console.log('🔍 Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_number ON transactions(transaction_number);
      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
      CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
      CREATE INDEX IF NOT EXISTS idx_forecasts_type_period ON forecasts(type, period, start_date);
      CREATE INDEX IF NOT EXISTS idx_forecasts_branch_id ON forecasts(branch_id);
      CREATE INDEX IF NOT EXISTS idx_forecasts_created_by ON forecasts(created_by);
      CREATE INDEX IF NOT EXISTS idx_analytics_type_date ON analytics(type, date);
      CREATE INDEX IF NOT EXISTS idx_pending_approvals_status ON pending_approvals(status);
    `);
    
    console.log('✅ All indexes created successfully!');
    
    // Create default branch
    console.log('🏢 Creating default branch...');
    const branchResult = await pool.query(`
      INSERT INTO branches (name, type, address, city, state, phone, email, manager)
      VALUES ('Main Branch', 'main', '123 Main Street', 'Lagos', 'Lagos State', '+2341234567890', 'main@maxgas.com', 'Branch Manager')
      RETURNING id
    `);
    const branchId = branchResult.rows[0].id;
    console.log('✅ Default branch created with ID:', branchId);
    
    // Create users with new credentials
    console.log('👥 Creating users with new credentials...');
    
    const users = [
      {
        username: '1admin',
        email: 'admin@maxgas.com',
        password: 'maxgas1455',
        full_name: 'System Administrator',
        role: 'admin'
      },
      {
        username: 'manager',
        email: 'manager@maxgas.com',
        password: 'maxmanager',
        full_name: 'Branch Manager',
        role: 'manager'
      },
      {
        username: 'operator',
        email: 'operator@maxgas.com',
        password: 'operator123',
        full_name: 'System Operator',
        role: 'operator'
      }
    ];
    
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      await pool.query(`
        INSERT INTO users (username, email, password, full_name, role, branch_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [user.username, user.email, hashedPassword, user.full_name, user.role, branchId]);
      console.log(`✅ Created user: ${user.username} (${user.role})`);
    }
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('\n📋 New User Credentials:');
    console.log('👑 Admin: 1admin / maxgas1455');
    console.log('👔 Manager: manager / maxmanager');
    console.log('👷 Operator: operator / operator123');
    console.log('\n🏢 Default branch created with ID:', branchId);
    console.log('📊 All tables created with complete schema');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

resetDatabase(); 