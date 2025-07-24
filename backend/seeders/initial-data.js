const bcrypt = require('bcryptjs');
const { User, Branch, Customer, Transaction } = require('../models');

async function seedInitialData() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create main branch
    const mainBranch = await Branch.create({
      name: 'Main Branch',
      type: 'main',
      address: '123 Main Street, Lagos',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      phone: '+2348012345678',
      email: 'main@maxgas.com',
      manager: 'John Doe',
      status: 'active',
      description: 'Main headquarters and primary distribution center',
      openingHours: 'Monday - Saturday: 8:00 AM - 6:00 PM',
      timezone: 'Africa/Lagos'
    });

    console.log('✅ Main branch created');

    // Create admin users (business owners)
    const adminUser1 = await User.create({
      username: 'admin',
      email: 'admin@maxgas.com',
      password: 'admin123',
      fullName: 'System Administrator',
      role: 'admin',
      branchId: mainBranch.id,
      permissions: ['all'],
      status: 'active'
    });

    const adminUser2 = await User.create({
      username: 'owner',
      email: 'owner@maxgas.com',
      password: 'owner123',
      fullName: 'Business Owner',
      role: 'admin',
      branchId: mainBranch.id,
      permissions: ['all'],
      status: 'active'
    });

    console.log('✅ Admin user created');

    // Create sample customers
    const customers = await Customer.bulkCreate([
      {
        name: 'Adebayo Johnson',
        phone: '+2348012345679',
        email: 'adebayo@email.com',
        address: '45 Victoria Island, Lagos',
        category: 'premium',
        branchId: mainBranch.id,
        creditLimit: 50000,
        status: 'active',
        notes: 'Regular customer, pays on time'
      },
      {
        name: 'Fatima Hassan',
        phone: '+2348012345680',
        email: 'fatima@email.com',
        address: '12 Ikeja, Lagos',
        category: 'regular',
        branchId: mainBranch.id,
        creditLimit: 25000,
        status: 'active',
        notes: 'New customer'
      },
      {
        name: 'Chukwudi Okonkwo',
        phone: '+2348012345681',
        email: 'chukwudi@email.com',
        address: '78 Surulere, Lagos',
        category: 'wholesale',
        branchId: mainBranch.id,
        creditLimit: 100000,
        status: 'active',
        notes: 'Wholesale customer, large orders'
      },
      {
        name: 'Sarah Williams',
        phone: '+2348012345682',
        email: 'sarah@email.com',
        address: '23 Lekki, Lagos',
        category: 'retail',
        branchId: mainBranch.id,
        creditLimit: 15000,
        status: 'active',
        notes: 'Retail customer'
      },
      {
        name: 'Mohammed Ali',
        phone: '+2348012345683',
        email: 'mohammed@email.com',
        address: '67 Yaba, Lagos',
        category: 'regular',
        branchId: mainBranch.id,
        creditLimit: 30000,
        status: 'active',
        notes: 'Regular customer'
      }
    ]);

    console.log('✅ Sample customers created');

    // Create sample transactions
    const transactions = await Transaction.bulkCreate([
      {
        customerId: customers[0].id,
        userId: adminUser1.id,
        branchId: mainBranch.id,
        date: new Date('2024-01-15'),
        transaction_number: '240115-ABC123',
        load_6kg: 5,
        load_13kg: 3,
        load_50kg: 1,
        returns_breakdown: {
          max_empty: { kg6: 2, kg13: 1, kg50: 0, price6: 135, price13: 135, price50: 135 },
          swap_empty: { kg6: 0, kg13: 0, kg50: 0, price6: 160, price13: 160, price50: 160 },
          return_full: { kg6: 0, kg13: 0, kg50: 0 }
        },
        outright_breakdown: {
          kg6: 0, kg13: 0, kg50: 0, price6: 2200, price13: 4400, price50: 8000
        },
        total_returns: 3,
        total_load: 9,
        cylinder_balance_6kg: 3,
        cylinder_balance_13kg: 2,
        cylinder_balance_50kg: 1,
        cylinder_balance: 6,
        total_bill: 405,
        amount_paid: 405,
        financial_balance: 0,
        payment_method: 'cash',
        notes: 'Regular refill order'
      },
      {
        customerId: customers[1].id,
        userId: adminUser1.id,
        branchId: mainBranch.id,
        date: new Date('2024-01-16'),
        transaction_number: '240116-DEF456',
        load_6kg: 2,
        load_13kg: 1,
        load_50kg: 0,
        returns_breakdown: {
          max_empty: { kg6: 0, kg13: 0, kg50: 0, price6: 135, price13: 135, price50: 135 },
          swap_empty: { kg6: 0, kg13: 0, kg50: 0, price6: 160, price13: 160, price50: 160 },
          return_full: { kg6: 0, kg13: 0, kg50: 0 }
        },
        outright_breakdown: {
          kg6: 1, kg13: 0, kg50: 0, price6: 2200, price13: 4400, price50: 8000
        },
        total_returns: 0,
        total_load: 3,
        cylinder_balance_6kg: 1,
        cylinder_balance_13kg: 1,
        cylinder_balance_50kg: 0,
        cylinder_balance: 2,
        total_bill: 2200,
        amount_paid: 2000,
        financial_balance: 200,
        payment_method: 'credit',
        notes: 'Outright purchase with partial payment'
      },
      {
        customerId: customers[2].id,
        userId: adminUser1.id,
        branchId: mainBranch.id,
        date: new Date('2024-01-17'),
        transaction_number: '240117-GHI789',
        load_6kg: 10,
        load_13kg: 8,
        load_50kg: 5,
        returns_breakdown: {
          max_empty: { kg6: 5, kg13: 3, kg50: 2, price6: 135, price13: 135, price50: 135 },
          swap_empty: { kg6: 0, kg13: 0, kg50: 0, price6: 160, price13: 160, price50: 160 },
          return_full: { kg6: 0, kg13: 0, kg50: 0 }
        },
        outright_breakdown: {
          kg6: 0, kg13: 0, kg50: 0, price6: 2200, price13: 4400, price50: 8000
        },
        total_returns: 10,
        total_load: 23,
        cylinder_balance_6kg: 5,
        cylinder_balance_13kg: 5,
        cylinder_balance_50kg: 3,
        cylinder_balance: 13,
        total_bill: 1350,
        amount_paid: 1350,
        financial_balance: 0,
        payment_method: 'cash',
        notes: 'Large order with returns'
      }
    ]);

    console.log('✅ Sample transactions created');

    // Create additional branches
    const additionalBranches = await Branch.bulkCreate([
      {
        name: 'Ikeja Branch',
        type: 'retail',
        address: '456 Allen Avenue, Ikeja',
        city: 'Ikeja',
        state: 'Lagos',
        country: 'Nigeria',
        phone: '+2348012345684',
        email: 'ikeja@maxgas.com',
        manager: 'Jane Smith',
        status: 'active',
        description: 'Retail branch serving Ikeja area',
        openingHours: 'Monday - Saturday: 8:00 AM - 6:00 PM',
        timezone: 'Africa/Lagos'
      },
      {
        name: 'Victoria Island Branch',
        type: 'retail',
        address: '789 Ahmadu Bello Way, Victoria Island',
        city: 'Victoria Island',
        state: 'Lagos',
        country: 'Nigeria',
        phone: '+2348012345685',
        email: 'vi@maxgas.com',
        manager: 'Michael Brown',
        status: 'active',
        description: 'Premium retail branch',
        openingHours: 'Monday - Saturday: 8:00 AM - 6:00 PM',
        timezone: 'Africa/Lagos'
      }
    ]);

    console.log('✅ Additional branches created');

    // Create additional users
    const additionalUsers = await User.bulkCreate([
      {
        username: 'manager1',
        email: 'manager1@maxgas.com',
        password: 'manager123',
        fullName: 'Jane Smith',
        role: 'manager',
        branchId: additionalBranches[0].id,
        permissions: ['customers', 'transactions', 'reports'],
        status: 'active'
      },
      {
        username: 'operator1',
        email: 'operator1@maxgas.com',
        password: 'operator123',
        fullName: 'Michael Brown',
        role: 'operator',
        branchId: additionalBranches[1].id,
        permissions: ['customers', 'transactions'],
        status: 'active'
      }
    ]);

    console.log('✅ Additional users created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- ${additionalBranches.length + 1} branches created`);
    console.log(`- ${additionalUsers.length + 2} users created`);
    console.log(`- ${customers.length} customers created`);
    console.log(`- ${transactions.length} transactions created`);
    console.log('\n🔑 Default login credentials:');
    console.log('Admin 1: admin@maxgas.com / admin123');
    console.log('Admin 2: owner@maxgas.com / owner123');
    console.log('Manager: manager1@maxgas.com / manager123');
    console.log('Operator: operator1@maxgas.com / operator123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

module.exports = { seedInitialData }; 