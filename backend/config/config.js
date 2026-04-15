/**
 * Sequelize CLI expects this file for migrations.
 * Keep in sync with config/env.js / .env
 */

require('dotenv').config();

const useUrl = !!process.env.DATABASE_URL;

const base = useUrl
  ? {
      use_env_variable: 'DATABASE_URL',
      dialect: 'postgres',
      dialectOptions:
        String(process.env.DB_SSL || 'false').toLowerCase() === 'true'
          ? { ssl: { require: true, rejectUnauthorized: true } }
          : {},
    }
  : {
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'attendance_portal',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      dialect: 'postgres',
      dialectOptions:
        String(process.env.DB_SSL || 'false').toLowerCase() === 'true'
          ? { ssl: { require: true, rejectUnauthorized: true } }
          : {},
    };

module.exports = {
  development: { ...base, logging: console.log },
  test: {
    ...base,
    database: process.env.DB_NAME_TEST || 'attendance_portal_test',
    logging: false,
  },
  production: { ...base, logging: false },
};
