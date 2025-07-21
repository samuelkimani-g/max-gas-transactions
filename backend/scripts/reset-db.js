// backend/scripts/reset-db.js
const { sequelize } = require('../config/database');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Branch = require('../models/Branch');
const PendingApproval = require('../models/PendingApproval');

const resetDatabase = async () => {
  console.log('--- Starting Database Reset ---');
  console.log('This will drop all tables and recreate them based on the latest models.');
  
  try {
    // The { force: true } option will drop tables if they already exist.
    // This is a destructive operation.
    await sequelize.sync({ force: true });
    
    console.log('✅ Database reset complete! All tables have been recreated successfully.');
    console.log('You can now start the application with a clean, up-to-date schema.');
    
  } catch (error) {
    console.error('❌ Error resetting the database:', error);
  } finally {
    await sequelize.close();
    console.log('--- Database connection closed ---');
  }
};

resetDatabase(); 