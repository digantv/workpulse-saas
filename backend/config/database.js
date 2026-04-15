/**
 * Sequelize instance and PostgreSQL connection configuration.
 */

const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('../utils/logger');

const commonOptions = {
  dialect: 'postgres',
  logging:
    env.nodeEnv === 'development'
      ? (msg) => logger.debug(msg)
      : false,
  pool: {
    max: env.isProduction ? 20 : 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: env.database.ssl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: env.isProduction,
        },
      }
    : {},
  define: {
    underscored: true,
    timestamps: true,
  },
};

let sequelize;

if (env.database.url) {
  sequelize = new Sequelize(env.database.url, commonOptions);
} else {
  sequelize = new Sequelize(
    env.database.name,
    env.database.user,
    env.database.password,
    {
      host: env.database.host,
      port: env.database.port,
      ...commonOptions,
    }
  );
}

/**
 * Verify database connectivity (call on startup).
 */
async function assertDatabaseConnection() {
  await sequelize.authenticate();
  logger.info('Database connection established');
}

module.exports = {
  sequelize,
  assertDatabaseConnection,
};
