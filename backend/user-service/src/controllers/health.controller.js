'use strict';

const healthService = require('../services/health.service');

async function healthCheck(req, res) {
  const health = await healthService.getHealth();
  // 503 lets Docker/Kubernetes probes treat a lost DB connection as unhealthy.
  res.status(health.status === 'ok' ? 200 : 503).json(health);
}

module.exports = { healthCheck };
