require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  sourceUrl: process.env.SOURCE_URL,
  dbPath: process.env.DB_PATH || './prices.db',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = config;
