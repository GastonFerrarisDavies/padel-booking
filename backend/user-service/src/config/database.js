'use strict';

const mysql = require('mysql2/promise');
const { config } = require('./index');

// The pool opens connections lazily, so creating it never blocks startup.
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  connectionLimit: config.db.connectionLimit,
  waitForConnections: true,
  enableKeepAlive: true,
  connectTimeout: 5000,
  // MySQL (container default) stores/returns timestamps in UTC; parse them as UTC, not local time.
  timezone: 'Z',
});

async function ping() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

async function close() {
  await pool.end();
}

module.exports = { pool, ping, close };
