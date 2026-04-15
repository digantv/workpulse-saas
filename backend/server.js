/**
 * HTTP server entry — loads config, verifies DB, graceful shutdown.
 */

require('./config/env');

const http = require('http');
const app = require('./app');
const { sequelize, assertDatabaseConnection } = require('./config/database');
const logger = require('./utils/logger');
const env = require('./config/env');

const port = env.port;

function createServer() {
  return http.createServer(app);
}

async function shutdown(server, signal) {
  logger.info(`${signal} received, closing server`);

  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });

  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (err) {
    logger.error('Error closing database', { err: err.message });
  }

  process.exit(0);
}

async function start() {
  await assertDatabaseConnection();

  const server = createServer();

  server.listen(port, () => {
    logger.info(`Server listening on port ${port}`, {
      nodeEnv: env.nodeEnv,
    });
  });

  server.on('error', (err) => {
    logger.error('HTTP server error', { err: err.message, stack: err.stack });
    process.exit(1);
  });

  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
      shutdown(server, signal).catch((err) => {
        logger.error('Shutdown failed', { err: err.message });
        process.exit(1);
      });
    });
  });
}

start().catch((err) => {
  logger.error('Failed to start server', {
    err: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
