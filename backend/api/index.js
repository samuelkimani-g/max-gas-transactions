const app = require('../server');

// Initialize database connection for serverless
async function initializeDatabase() {
  try {
    const { sequelize } = require('../config/database');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
}

// Wrap the app to ensure database is initialized
const handler = async (req, res) => {
  try {
    // Initialize database on first request
    if (!global.dbInitialized) {
      await initializeDatabase();
      global.dbInitialized = true;
    }
    
    return app(req, res);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};

module.exports = handler; 