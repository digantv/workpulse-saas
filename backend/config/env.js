/**
 * Centralized environment configuration with validation at startup.
 * Fails fast in production when required values are missing.
 */

require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    if (isProduction) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }
  return value;
}

const databaseUrl = process.env.DATABASE_URL;

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT || 5432);
const dbName = process.env.DB_NAME || 'attendance_portal';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || '';
const dbSsl =
  String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

if (isProduction && !databaseUrl) {
  requireEnv('DB_PASSWORD');
}

const corsOriginsRaw = process.env.CORS_ORIGINS || '';
const corsOrigins = corsOriginsRaw
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const cookieSecret =
  requireEnv('COOKIE_SECRET') ||
  (isProduction ? undefined : 'dev-only-insecure-cookie-secret');

if (isProduction && (!cookieSecret || cookieSecret.length < 32)) {
  throw new Error(
    'COOKIE_SECRET must be set to a strong value (at least 32 characters) in production'
  );
}

const rateLimitWindowMs = Number(
  process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000
);
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 200);

const sessionIdleMs = Number(process.env.SESSION_IDLE_MS || 15 * 60 * 1000);
const sessionCookieName =
  process.env.SESSION_COOKIE_NAME || 'session_token';

/** IANA timezone for attendance calendar day and timesheet defaults (see `ATTENDANCE_TIMEZONE` in `.env.example`). */
const attendanceTimezone = process.env.ATTENDANCE_TIMEZONE || 'UTC';

module.exports = {
  nodeEnv: NODE_ENV,
  isProduction,
  port: Number(process.env.PORT || 4000),
  database: {
    url: databaseUrl,
    host: dbHost,
    port: dbPort,
    name: dbName,
    user: dbUser,
    password: dbPassword,
    ssl: dbSsl,
  },
  corsOrigins,
  cookieSecret,
  rateLimit: {
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
  },
  session: {
    idleMs: sessionIdleMs,
    cookieName: sessionCookieName,
  },
  attendanceTimezone,
};
