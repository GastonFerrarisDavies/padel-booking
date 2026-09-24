'use strict';

const authService = require('../services/auth.service');
const userService = require('../services/user.service');
const { HttpError } = require('../utils/http-error');

// Verifies the Bearer token and loads the user from the DB, so role changes
// and deactivations take effect immediately instead of when the token expires.
async function authenticate(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'missing bearer token');

  const { sub } = authService.verifyToken(token);
  const user = await userService.findById(sub);
  if (!user || !user.active) throw new HttpError(401, 'invalid or expired token');

  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) throw new HttpError(403, 'insufficient permissions');
    next();
  };
}

module.exports = { authenticate, requireRole };
