'use strict';

const express = require('express');
const { clerkMiddleware } = require('@clerk/express');
const { config } = require('./config');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error-handler');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  // Parses the Clerk session token (Bearer header or __session cookie) into req.auth.
  // It never rejects on its own; routes opt in with middlewares/auth.js.
  app.use(
    clerkMiddleware({
      authorizedParties: config.clerk.authorizedParties.length > 0 ? [...config.clerk.authorizedParties] : undefined,
    }),
  );

  app.use(routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
