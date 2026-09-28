'use strict';

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toList = (value) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

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
  // @clerk/express reads CLERK_SECRET_KEY / CLERK_PUBLISHABLE_KEY from the environment itself.
  clerk: Object.freeze({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    // Origins allowed as the token's `azp` (e.g. https://padel.example.com). Empty => not checked.
    authorizedParties: Object.freeze(toList(process.env.CLERK_AUTHORIZED_PARTIES)),
  }),
  // Clerk account whose primary email matches becomes OWNER on first sign-in, if no OWNER exists yet.
  ownerEmail: (process.env.OWNER_EMAIL || '').trim().toLowerCase(),
});

const REQUIRED_SETTINGS = {
  DB_HOST: config.db.host,
  DB_USER: config.db.user,
  DB_PASSWORD: config.db.password,
  DB_DATABASE: config.db.database,
  CLERK_SECRET_KEY: config.clerk.secretKey,
  CLERK_PUBLISHABLE_KEY: config.clerk.publishableKey,
};

function assertConfig() {
  const missing = Object.keys(REQUIRED_SETTINGS).filter((name) => !REQUIRED_SETTINGS[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { config, assertConfig };
