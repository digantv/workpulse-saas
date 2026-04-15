/**
 * Express application factory — middleware and route wiring only.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const routes = require('./routes');
const { notFoundHandler } = require('./middlewares/not-found');
const { errorHandler } = require('./middlewares/error-handler');

const app = express();

app.set('trust proxy', env.isProduction ? 1 : 0);

app.use(
  helmet({
    contentSecurityPolicy: env.isProduction ? undefined : false,
  })
);

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin:
      env.corsOrigins.length > 0
        ? env.corsOrigins
        : !env.isProduction
          ? defaultDevOrigins
          : false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(env.cookieSecret));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
    },
  });
});

const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
});

app.use('/api', apiLimiter, routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
