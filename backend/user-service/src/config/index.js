'use strict';

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const config = Object.freeze({
  serviceName: 'user-service',
  env: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),
  db: Object.freeze({
    host: process.env.DB_HOST || 'localhost',
    port: toInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: toInt(process.env.DB_POOL_SIZE, 10),
  }),
});

const REQUIRED_DB_VARS = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE'];

function assertConfig() {
  const missing = REQUIRED_DB_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { config, assertConfig };
