'use strict';

const { config, assertConfig } = require('./config');

assertConfig();

const db = require('./config/database');
const { createApp } = require('./app');

const SHUTDOWN_TIMEOUT_MS = 10000;

const app = createApp();

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`[${config.serviceName}] listening on port ${config.port} (${config.env})`);
});

// Log DB reachability at boot without blocking startup: the health check
// reports the live state, so the container can start before MySQL is ready.
db.ping()
  .then(() => console.log(`[${config.serviceName}] connected to MySQL at ${config.db.host}:${config.db.port}`))
  .catch((err) => console.warn(`[${config.serviceName}] MySQL not reachable yet: ${err.code || err.message}`));

require('./config/schema').initSchema();

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[${config.serviceName}] ${signal} received, shutting down`);

  const forceExit = setTimeout(() => {
    console.error(`[${config.serviceName}] forced shutdown after ${SHUTDOWN_TIMEOUT_MS}ms`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close(async () => {
    try {
      await db.close();
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
