/**
 * Structured logging (Winston). Use in app code instead of console.*
 */

const winston = require('winston');
const env = require('../config/env');

const { combine, timestamp, errors, json, colorize, printf } =
  winston.format;

const devFormat = printf(({ level, message, stack, ...meta }) => {
  const metaStr =
    Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return stack
    ? `${level}: ${message}\n${stack}${metaStr}`
    : `${level}: ${message}${metaStr}`;
});

const logger = winston.createLogger({
  level: env.isProduction ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp(),
    env.isProduction ? json() : combine(colorize(), devFormat)
  ),
  defaultMeta: { service: 'attendance-portal-api' },
  transports: [new winston.transports.Console()],
});

module.exports = logger;
