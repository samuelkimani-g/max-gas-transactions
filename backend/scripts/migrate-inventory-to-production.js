const { sequelize } = require('../config/database');
const Inventory = require('../models/Inventory');
const Branch = require('../models/Branch');
const User = require('../models/User');

const migrateInventoryToProduction = async () => {
  try {
    console.log('🔄 Starting inventory migration to production database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync the Inventory model with the database (create table if it doesn't exist)
    await Inventory.sync({ force: false });
    console.log('✅ Inventory table created/verified');
    
    // Check if inventory table has any data
    const existingInventory = await Inventory.count();
    
    if (existingInventory === 0) {
      console.log('🔄 Adding initial inventory data to production...');
      
      // Get the first branch and user for initial data
      const firstBranch = await Branch.findOne();
      const firstUser = await User.findOne();
      
      if (!firstBranch || !firstUser) {
        console.log('⚠️  No branch or user found. Creating default data...');
        
        // Create default branch if none exists
        if (!firstBranch) {
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
        
        // Create default user if none exists
        if (!firstUser) {
          await User.create({
            username: 'admin',
            fullName: 'Admin User',
            email: 'admin@gascylinder.com',
            password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
            role: 'admin'
          });
          console.log('✅ Default admin user created');
        }
      }
      
      // Get the branch and user IDs
      const branch = await Branch.findOne();
      const user = await User.findOne();
      
      const initialData = [
        {
          cylinder_type: '6KG',
          available_stock_kg: 1000,
          supplier_place: 'Nairobi Gas Depot',
          cost_per_kg: 150.00,
          total_amount_paid: 150000.00,
          branchId: branch.id,
          createdBy: user.id
        },
        {
          cylinder_type: '13KG',
          available_stock_kg: 2000,
          supplier_place: 'Nairobi Gas Depot',
          cost_per_kg: 140.00,
          total_amount_paid: 280000.00,
          branchId: branch.id,
          createdBy: user.id
        },
        {
          cylinder_type: '50KG',
          available_stock_kg: 500,
          supplier_place: 'Mombasa Gas Plant',
          cost_per_kg: 130.00,
          total_amount_paid: 65000.00,
          branchId: branch.id,
          createdBy: user.id
        },
        {
          cylinder_type: 'LPG Bulk',
          available_stock_kg: 10000,
          supplier_place: 'Kisumu Gas Terminal',
          cost_per_kg: 120.00,
          total_amount_paid: 1200000.00,
          branchId: branch.id,
          createdBy: user.id
        }
      ];
      
      for (const data of initialData) {
        await Inventory.create(data);
      }
      
      console.log('✅ Initial inventory data added to production database');
    } else {
      console.log('ℹ️  Inventory table already has data, skipping initial data insertion');
    }
    
    console.log('🎉 Inventory migration to production completed successfully!');
    
  } catch (error) {
    console.error('❌ Error migrating inventory to production:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateInventoryToProduction()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateInventoryToProduction;
