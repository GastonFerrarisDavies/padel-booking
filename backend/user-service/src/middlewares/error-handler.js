'use strict';

function notFound(req, res) {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
}

// Express 5 forwards rejected promises from async handlers here automatically.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : err.message,
  });
}

module.exports = { notFound, errorHandler };
