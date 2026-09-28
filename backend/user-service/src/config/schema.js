'use strict';

const { pool } = require('./database');
const { config } = require('./index');

const RETRY_DELAY_MS = 5000;

// Clerk owns identity (name, email, credentials); this table only holds authorization.
// A row is created the first time a Clerk user calls the API (see services/user.service.js).
const CREATE_USER_ROLES_TABLE = `
  CREATE TABLE IF NOT EXISTS user_roles (
    clerk_id   VARCHAR(64) NOT NULL PRIMARY KEY,
    role       ENUM('OWNER', 'ADMIN', 'PLAYER') NOT NULL DEFAULT 'PLAYER',
    active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_user_roles_role (role)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

async function migrate() {
  await pool.query(CREATE_USER_ROLES_TABLE);
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
