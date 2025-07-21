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
        maxGas6kgLoad: 5,
        maxGas13kgLoad: 3,
        maxGas50kgLoad: 1,
        return6kg: 2,
        return13kg: 1,
        return50kg: 0,
        outright6kg: 0,
        outright13kg: 0,
        outright50kg: 0,
        swipeReturn6kg: 0,
        swipeReturn13kg: 0,
        swipeReturn50kg: 0,
        refillPrice6kg: 135,
        refillPrice13kg: 135,
        refillPrice50kg: 135,
        outrightPrice6kg: 3200,
        outrightPrice13kg: 3500,
        outrightPrice50kg: 8500,
        swipeRefillPrice6kg: 160,
        swipeRefillPrice13kg: 160,
        swipeRefillPrice50kg: 160,
        total: 405,
        paid: 405,
        balance: 0,
        paymentMethod: 'cash',
        status: 'completed',
        notes: 'Regular refill order'
      },
      {
        customerId: customers[1].id,
        userId: adminUser1.id,
        branchId: mainBranch.id,
        date: new Date('2024-01-16'),
        maxGas6kgLoad: 2,
        maxGas13kgLoad: 1,
        maxGas50kgLoad: 0,
        return6kg: 0,
        return13kg: 0,
        return50kg: 0,
        outright6kg: 1,
        outright13kg: 0,
        outright50kg: 0,
        swipeReturn6kg: 0,
        swipeReturn13kg: 0,
        swipeReturn50kg: 0,
        refillPrice6kg: 135,
        refillPrice13kg: 135,
        refillPrice50kg: 135,
        outrightPrice6kg: 3200,
        outrightPrice13kg: 3500,
        outrightPrice50kg: 8500,
        swipeRefillPrice6kg: 160,
        swipeRefillPrice13kg: 160,
        swipeRefillPrice50kg: 160,
        total: 3200,
        paid: 2000,
        balance: 1200,
        paymentMethod: 'credit',
        status: 'completed',
        notes: 'Outright purchase with partial payment'
      },
      {
        customerId: customers[2].id,
        userId: adminUser1.id,
        branchId: mainBranch.id,
        date: new Date('2024-01-17'),
        maxGas6kgLoad: 10,
        maxGas13kgLoad: 8,
        maxGas50kgLoad: 5,
        return6kg: 5,
        return13kg: 3,
        return50kg: 2,
        outright6kg: 0,
        outright13kg: 0,
        outright50kg: 0,
        swipeReturn6kg: 0,
        swipeReturn13kg: 0,
        swipeReturn50kg: 0,
        refillPrice6kg: 135,
        refillPrice13kg: 135,
        refillPrice50kg: 135,
        outrightPrice6kg: 3200,
        outrightPrice13kg: 3500,
        outrightPrice50kg: 8500,
        swipeRefillPrice6kg: 160,
        swipeRefillPrice13kg: 160,
        swipeRefillPrice50kg: 160,
        total: 1350,
        paid: 1350,
        balance: 0,
        paymentMethod: 'transfer',
        status: 'completed',
        notes: 'Wholesale order'
      },
      {
        customerId: customers[3].id,
        userId: adminUser1.id,
        branchId: mainBranch.id,
        date: new Date('2024-01-18'),
        maxGas6kgLoad: 3,
        maxGas13kgLoad: 2,
        maxGas50kgLoad: 0,
        return6kg: 1,
        return13kg: 0,
        return50kg: 0,
        outright6kg: 0,
        outright13kg: 0,
        outright50kg: 0,
        swipeReturn6kg: 0,
        swipeReturn13kg: 0,
        swipeReturn50kg: 0,
        refillPrice6kg: 135,
        refillPrice13kg: 135,
        refillPrice50kg: 135,
        outrightPrice6kg: 3200,
        outrightPrice13kg: 3500,
        outrightPrice50kg: 8500,
        swipeRefillPrice6kg: 160,
        swipeRefillPrice13kg: 160,
        swipeRefillPrice50kg: 160,
        total: 135,
        paid: 135,
        balance: 0,
        paymentMethod: 'cash',
        status: 'completed',
        notes: 'Small refill order'
      },
      {
        customerId: customers[4].id,
        userId: adminUser1.id,
        branchId: mainBranch.id,
        date: new Date('2024-01-19'),
        maxGas6kgLoad: 1,
        maxGas13kgLoad: 2,
        maxGas50kgLoad: 0,
        return6kg: 0,
        return13kg: 0,
        return50kg: 0,
        outright6kg: 0,
        outright13kg: 1,
        outright50kg: 0,
        swipeReturn6kg: 0,
        swipeReturn13kg: 0,
        swipeReturn50kg: 0,
        refillPrice6kg: 135,
        refillPrice13kg: 135,
        refillPrice50kg: 135,
        outrightPrice6kg: 3200,
        outrightPrice13kg: 3500,
        outrightPrice50kg: 8500,
        swipeRefillPrice6kg: 160,
        swipeRefillPrice13kg: 160,
        swipeRefillPrice50kg: 160,
        total: 3500,
        paid: 3500,
        balance: 0,
        paymentMethod: 'card',
        status: 'completed',
        notes: '13kg cylinder purchase'
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