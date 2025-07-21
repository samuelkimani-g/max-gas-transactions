const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    // Optimize connection settings
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
  },
  pool: {
    max: 10,          // Maximum number of connections
    min: 2,           // Minimum number of connections
    acquire: 30000,   // Maximum time to get connection (30s)
    idle: 10000,      // Maximum time connection can be idle (10s)
    evict: 60000,     // Check for idle connections every minute
  },
  // Retry failed connections
  retry: {
    max: 3,
    timeout: 10000,
  },
  // Connection timeout
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