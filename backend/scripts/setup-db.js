const { sequelize } = require('../config/database');
const { User, Customer, Transaction, Branch, Forecast, Analytics, Payment, Inventory } = require('../models');

async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync all models (create tables)
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database models synchronized.');
    
    // Ensure inventory table exists and has initial data
    const inventoryCount = await Inventory.count();
    if (inventoryCount === 0) {
      console.log('🔄 Adding initial inventory data...');
      
      const initialData = [
        {
          cylinder_type: '6KG',
          available_stock_kg: 1000,
          supplier_place: 'Nairobi Gas Depot',
          cost_per_kg: 150.00,
          total_amount_paid: 150000.00,
          branchId: 1,
          createdBy: 1
        },
        {
          cylinder_type: '13KG',
          available_stock_kg: 2000,
          supplier_place: 'Nairobi Gas Depot',
          cost_per_kg: 140.00,
          total_amount_paid: 280000.00,
          branchId: 1,
          createdBy: 1
        },
        {
          cylinder_type: '50KG',
          available_stock_kg: 500,
          supplier_place: 'Mombasa Gas Plant',
          cost_per_kg: 130.00,
          total_amount_paid: 65000.00,
          branchId: 1,
          createdBy: 1
        },
        {
          cylinder_type: 'LPG Bulk',
          available_stock_kg: 10000,
          supplier_place: 'Kisumu Gas Terminal',
          cost_per_kg: 120.00,
          total_amount_paid: 1200000.00,
          branchId: 1,
          createdBy: 1
        }
      ];
      
      for (const data of initialData) {
        await Inventory.create(data);
      }
      
      console.log('✅ Initial inventory data added');
    }
    
    // Create default admin user if it doesn't exist
    const adminExists = await User.findOne({ where: { email: 'admin@gascylinder.com' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        fullName: 'Admin User',
        email: 'admin@gascylinder.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'admin'
      });
      console.log('✅ Default admin user created (email: admin@gascylinder.com, password: password)');
    }
    
    // Create default branch if it doesn't exist
    const branchExists = await Branch.findOne({ where: { name: 'Main Branch' } });
    if (!branchExists) {
      await Branch.create({
        name: 'Main Branch',
        type: 'main',
        address: '123 Gas Street',
        city: 'Mombasa',
        state: 'Mombasa County',
        country: 'Kenya',
        phone: '+254700000000',
        email: 'main@gascylinder.com'
      });
      console.log('✅ Default branch created');
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run seed (to add sample data)');
    console.log('2. Start the server: npm run dev');
    console.log('3. Access the application at: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase; 