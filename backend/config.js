require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  sourceUrl: process.env.SOURCE_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = config;
