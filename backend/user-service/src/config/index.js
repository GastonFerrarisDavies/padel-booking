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
    // DB_USERNAME kept as fallback for manifests written for the old NestJS service.
    user: process.env.DB_USER || process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: toInt(process.env.DB_POOL_SIZE, 10),
  }),
  jwt: Object.freeze({
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  }),
  // Optional bootstrap account: created as OWNER only if no OWNER exists yet.
  owner: Object.freeze({
    name: process.env.OWNER_NAME || 'Owner',
    email: process.env.OWNER_EMAIL,
    password: process.env.OWNER_PASSWORD,
  }),
});

const REQUIRED_SETTINGS = {
  DB_HOST: config.db.host,
  DB_USER: config.db.user,
  DB_PASSWORD: config.db.password,
  DB_DATABASE: config.db.database,
  JWT_SECRET: config.jwt.secret,
};

function assertConfig() {
  const missing = Object.keys(REQUIRED_SETTINGS).filter((name) => !REQUIRED_SETTINGS[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { config, assertConfig };
