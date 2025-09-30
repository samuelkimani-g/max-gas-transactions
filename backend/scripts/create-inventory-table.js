const { sequelize } = require('../config/database');
const Inventory = require('../models/Inventory');

const createInventoryTable = async () => {
  try {
    console.log('🔄 Creating inventory table...');
    
    // Sync the Inventory model with the database
    await Inventory.sync({ force: false });
    
    console.log('✅ Inventory table created successfully');
    
    // Add some initial inventory data if table is empty
    const existingInventory = await Inventory.count();
    
    if (existingInventory === 0) {
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
      
      console.log('✅ Initial inventory data added successfully');
    } else {
      console.log('ℹ️  Inventory table already has data, skipping initial data insertion');
    }
    
  } catch (error) {
    console.error('❌ Error creating inventory table:', error);
    throw error;
  }
};

// Run the migration if this script is executed directly
if (require.main === module) {
  createInventoryTable()
    .then(() => {
      console.log('🎉 Inventory table migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Inventory table migration failed:', error);
      process.exit(1);
    });
}

module.exports = createInventoryTable;
