'use strict';

// Thrown from services/middlewares; error-handler.js turns it into `{ error }` with this status.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

module.exports = { HttpError };
