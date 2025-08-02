const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_lvMj5ztu9dSq@ep-still-forest-a18968mz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function addSampleData() {
  try {
    console.log('📊 Adding sample data to database...');
    
    // Get the default branch ID
    const branchResult = await pool.query('SELECT id FROM branches LIMIT 1');
    const branchId = branchResult.rows[0].id;
    console.log('🏢 Using branch ID:', branchId);
    
    // Get a user ID for transactions
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userResult.rows[0].id;
    console.log('👤 Using user ID:', userId);
    
    // Add sample customers
    const customers = [
      {
        name: 'John Doe',
        phone: '+254700123456',
        email: 'john.doe@email.com',
        address: '123 Main Street, Nairobi',
        category: 'regular',
        branch_id: branchId,
        status: 'active',
        credit_limit: 5000,
        balance: 0,
        notes: 'Reliable customer',
        total_transactions: 0,
        total_spent: 0
      },
      {
        name: 'Jane Smith',
        phone: '+254700234567',
        email: 'jane.smith@email.com',
        address: '456 Oak Avenue, Mombasa',
        category: 'premium',
        branch_id: branchId,
        status: 'active',
        credit_limit: 3000,
        balance: 0,
        notes: 'Premium customer',
        total_transactions: 0,
        total_spent: 0
      },
      {
        name: 'Mike Johnson',
        phone: '+254700345678',
        email: 'mike.johnson@email.com',
        address: '789 Pine Road, Kisumu',
        category: 'regular',
        branch_id: branchId,
        status: 'active',
        credit_limit: 4000,
        balance: 0,
        notes: 'New customer',
        total_transactions: 0,
        total_spent: 0
      },
      {
        name: 'Sarah Wilson',
        phone: '+254700456789',
        email: 'sarah.wilson@email.com',
        address: '321 Elm Street, Nakuru',
        category: 'regular',
        branch_id: branchId,
        status: 'active',
        credit_limit: 2500,
        balance: 0,
        notes: 'Regular customer',
        total_transactions: 0,
        total_spent: 0
      },
      {
        name: 'David Brown',
        phone: '+254700567890',
        email: 'david.brown@email.com',
        address: '654 Maple Drive, Eldoret',
        category: 'premium',
        branch_id: branchId,
        status: 'active',
        credit_limit: 6000,
        balance: 0,
        notes: 'Premium customer',
        total_transactions: 0,
        total_spent: 0
      }
    ];
    
    console.log('👤 Adding customers...');
    for (const customer of customers) {
      await pool.query(`
        INSERT INTO customers (name, phone, email, address, category, branch_id, status, credit_limit, balance, notes, total_transactions, total_spent, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      `, [customer.name, customer.phone, customer.email, customer.address, customer.category, customer.branch_id, customer.status, customer.credit_limit, customer.balance, customer.notes, customer.total_transactions, customer.total_spent]);
    }
    console.log('✅ Added', customers.length, 'customers');
    
    // Get customer IDs for transactions
    const customerResult = await pool.query('SELECT id FROM customers');
    const customerIds = customerResult.rows.map(row => row.id);
    
    // Add sample transactions
    const transactions = [
      {
        customer_id: customerIds[0],
        user_id: userId,
        branch_id: branchId,
        date: new Date(),
        max_gas6kg_load: 0,
        max_gas13kg_load: 2,
        max_gas50kg_load: 0,
        return6kg: 0,
        return13kg: 0,
        return50kg: 0,
        outright6kg: 0,
        outright13kg: 0,
        outright50kg: 0,
        swipe_return6kg: 0,
        swipe_return13kg: 0,
        swipe_return50kg: 0,
        refill_price6kg: 0,
        refill_price13kg: 1800,
        refill_price50kg: 0,
        outright_price6kg: 0,
        outright_price13kg: 0,
        outright_price50kg: 0,
        swipe_refill_price6kg: 0,
        swipe_refill_price13kg: 0,
        swipe_refill_price50kg: 0,
        total: 3600,
        paid: 3600,
        balance: 0,
        notes: 'Gas cylinder refill',
        status: 'completed',
        payment_method: 'cash',
        invoice_number: 'INV-001',
        reference: 'REF-001'
      },
      {
        customer_id: customerIds[1],
        user_id: userId,
        branch_id: branchId,
        date: new Date(),
        max_gas6kg_load: 1,
        max_gas13kg_load: 0,
        max_gas50kg_load: 0,
        return6kg: 0,
        return13kg: 0,
        return50kg: 0,
        outright6kg: 0,
        outright13kg: 0,
        outright50kg: 0,
        swipe_return6kg: 0,
        swipe_return13kg: 0,
        swipe_return50kg: 0,
        refill_price6kg: 1200,
        refill_price13kg: 0,
        refill_price50kg: 0,
        outright_price6kg: 0,
        outright_price13kg: 0,
        outright_price50kg: 0,
        swipe_refill_price6kg: 0,
        swipe_refill_price13kg: 0,
        swipe_refill_price50kg: 0,
        total: 1200,
        paid: 0,
        balance: 1200,
        notes: 'Gas cylinder refill on credit',
        status: 'pending',
        payment_method: 'credit',
        invoice_number: 'INV-002',
        reference: 'REF-002'
      },
      {
        customer_id: customerIds[2],
        user_id: userId,
        branch_id: branchId,
        date: new Date(),
        max_gas6kg_load: 0,
        max_gas13kg_load: 1,
        max_gas50kg_load: 1,
        return6kg: 0,
        return13kg: 0,
        return50kg: 0,
        outright6kg: 0,
        outright13kg: 0,
        outright50kg: 0,
        swipe_return6kg: 0,
        swipe_return13kg: 0,
        swipe_return50kg: 0,
        refill_price6kg: 0,
        refill_price13kg: 1800,
        refill_price50kg: 3500,
        outright_price6kg: 0,
        outright_price13kg: 0,
        outright_price50kg: 0,
        swipe_refill_price6kg: 0,
        swipe_refill_price13kg: 0,
        swipe_refill_price50kg: 0,
        total: 5300,
        paid: 5300,
        balance: 0,
        notes: 'Multiple cylinder refills',
        status: 'completed',
        payment_method: 'cash',
        invoice_number: 'INV-003',
        reference: 'REF-003'
      }
    ];
    
    console.log('💰 Adding transactions...');
    for (const transaction of transactions) {
      await pool.query(`
        INSERT INTO transactions (
          customer_id, user_id, branch_id, date, 
          max_gas6kg_load, max_gas13kg_load, max_gas50kg_load,
          return6kg, return13kg, return50kg,
          outright6kg, outright13kg, outright50kg,
          swipe_return6kg, swipe_return13kg, swipe_return50kg,
          refill_price6kg, refill_price13kg, refill_price50kg,
          outright_price6kg, outright_price13kg, outright_price50kg,
          swipe_refill_price6kg, swipe_refill_price13kg, swipe_refill_price50kg,
          total, paid, balance, notes, status, payment_method,
          invoice_number, reference, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, NOW(), NOW())
      `, [
        transaction.customer_id, transaction.user_id, transaction.branch_id, transaction.date,
        transaction.max_gas6kg_load, transaction.max_gas13kg_load, transaction.max_gas50kg_load,
        transaction.return6kg, transaction.return13kg, transaction.return50kg,
        transaction.outright6kg, transaction.outright13kg, transaction.outright50kg,
        transaction.swipe_return6kg, transaction.swipe_return13kg, transaction.swipe_return50kg,
        transaction.refill_price6kg, transaction.refill_price13kg, transaction.refill_price50kg,
        transaction.outright_price6kg, transaction.outright_price13kg, transaction.outright_price50kg,
        transaction.swipe_refill_price6kg, transaction.swipe_refill_price13kg, transaction.swipe_refill_price50kg,
        transaction.total, transaction.paid, transaction.balance, transaction.notes, transaction.status, transaction.payment_method,
        transaction.invoice_number, transaction.reference
      ]);
    }
    console.log('✅ Added', transactions.length, 'transactions');
    
    // Update customer balances and transaction counts
    console.log('🔄 Updating customer statistics...');
    for (const customerId of customerIds) {
      const statsResult = await pool.query(`
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(SUM(total), 0) as total_spent,
          COALESCE(SUM(balance), 0) as total_balance
        FROM transactions 
        WHERE customer_id = $1
      `, [customerId]);
      
      const totalTransactions = parseInt(statsResult.rows[0].total_transactions);
      const totalSpent = parseFloat(statsResult.rows[0].total_spent);
      const totalBalance = parseFloat(statsResult.rows[0].total_balance);
      
      await pool.query(`
        UPDATE customers 
        SET total_transactions = $1, total_spent = $2, balance = $3 
        WHERE id = $4
      `, [totalTransactions, totalSpent, totalBalance, customerId]);
    }
    console.log('✅ Updated customer statistics');
    
    console.log('\n🎉 Sample data added successfully!');
    console.log('📊 Database now contains:');
    console.log('- 5 customers');
    console.log('- 3 transactions');
    console.log('- Updated customer balances and statistics');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
  } finally {
    await pool.end();
  }
}

addSampleData(); 