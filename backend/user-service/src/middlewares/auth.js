'use strict';

const { getAuth } = require('@clerk/express');
const userService = require('../services/user.service');
const { HttpError } = require('../utils/http-error');

// Authentication is Clerk's (clerkMiddleware in app.js verifies the session token);
// authorization comes from our user_roles table, read on every request so role
// changes and deactivations take effect immediately.
async function authenticate(req, res, next) {
  const { userId } = getAuth(req);
  if (!userId) throw new HttpError(401, 'missing or invalid session token');

  const access = await userService.ensureAccess(userId);
  if (!access.active) throw new HttpError(403, 'account is disabled');

  req.user = access;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) throw new HttpError(403, 'insufficient permissions');
    next();
  };
}

module.exports = { authenticate, requireRole };
