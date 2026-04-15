/**
 * Central error handler — maps errors to stable JSON responses.
 */

const env = require('../config/env');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message =
    status >= 500 && env.isProduction
      ? 'An unexpected error occurred'
      : err.message || 'An unexpected error occurred';

  if (status >= 500) {
    logger.error(err.message, { stack: err.stack, path: req.path });
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(env.isProduction ? {} : { details: err.details, stack: err.stack }),
    },
  });
}

module.exports = { errorHandler };
