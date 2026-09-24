'use strict';

const db = require('../config/database');
const { config } = require('../config');

const DB_CHECK_TIMEOUT_MS = 2000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function checkDatabase() {
  const startedAt = Date.now();
  try {
    await withTimeout(db.ping(), DB_CHECK_TIMEOUT_MS);
    return { status: 'up', latencyMs: Date.now() - startedAt };
  } catch (err) {
    return { status: 'down', error: err.code || err.message };
  }
}

async function getHealth() {
  const database = await checkDatabase();
  return {
    status: database.status === 'up' ? 'ok' : 'error',
    service: config.serviceName,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database,
  };
}

module.exports = { getHealth };
