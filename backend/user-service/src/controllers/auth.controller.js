'use strict';

/**
 * GET /auth/me — authorization of the session's Clerk user: `{ id, role, active, createdAt }`.
 * Identity (name, email) stays in Clerk. court-service and booking-service also call this
 * endpoint to authorize their protected routes, so it must not hit the Clerk API.
 */
function me(req, res) {
  res.json(req.user);
}

module.exports = { me };
