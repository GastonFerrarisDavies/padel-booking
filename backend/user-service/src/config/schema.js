'use strict';

const { pool } = require('./database');
const { config } = require('./index');
const { hashPassword } = require('../utils/password');

const RETRY_DELAY_MS = 5000;

const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id            CHAR(36)     NOT NULL PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('OWNER', 'ADMIN', 'PLAYER') NOT NULL DEFAULT 'PLAYER',
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

async function seedOwner() {
  const { email, password, name } = config.owner;
  if (!email || !password) return;

  const [rows] = await pool.query("SELECT 1 FROM users WHERE role = 'OWNER' LIMIT 1");
  if (rows.length > 0) return;

  // INSERT IGNORE: several replicas may race here; the unique email keeps one row.
  await pool.query(
    "INSERT IGNORE INTO users (id, name, email, password_hash, role) VALUES (UUID(), ?, ?, ?, 'OWNER')",
    [name, email.trim().toLowerCase(), await hashPassword(password)],
  );
  console.log(`[${config.serviceName}] bootstrap OWNER ensured for ${email}`);
}

async function migrate() {
  await pool.query(CREATE_USERS_TABLE);
  await seedOwner();
}

// Retries in the background so the service can boot before MySQL is ready.
function initSchema() {
  migrate()
    .then(() => console.log(`[${config.serviceName}] schema ready`))
    .catch((err) => {
      console.warn(`[${config.serviceName}] schema init failed (${err.code || err.message}), retrying in ${RETRY_DELAY_MS}ms`);
      setTimeout(initSchema, RETRY_DELAY_MS).unref();
    });
}

module.exports = { initSchema };
