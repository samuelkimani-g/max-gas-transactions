const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // Connection pooling (optimized for fewer connections)
  pool: {
    max: 5,           // Reduced maximum connections
    min: 1,           // Reduced minimum connections
    acquire: 30000,   // Maximum time to get connection (30s)
    idle: 15000,      // Increased idle time (15s)
    evict: 30000,     // Check for idle connections every 30s
  },
  
  // Retry failed connections
  retry: {
    max: 3,
    timeout: 10000,
  },
  
  // Connection settings
  dialectOptions: {
    ...((process.env.NODE_ENV === 'production') && {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }),
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  }
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connection established successfully (${process.env.NODE_ENV === 'production' ? 'PostgreSQL' : 'SQLite'})`);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = { sequelize, testConnection };