const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 15000,
      evict: 30000,
    },
    retry: {
      max: 3,
      timeout: 10000,
    },
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
} else {
  // Default to SQLite for local development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: __dirname + '/../database.sqlite',
    logging: false,
  });
}

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connection established successfully (${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'})`);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = { sequelize, testConnection };