'use strict';

const express = require('express');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error-handler');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.use(routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
