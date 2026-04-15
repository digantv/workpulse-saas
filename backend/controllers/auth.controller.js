'use strict';

const env = require('../config/env');
const authService = require('../services/auth.service');

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function clearSessionCookie(res) {
  res.clearCookie(env.session.cookieName, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
  });
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    const { token, employee } = await authService.login(username, password);

    res.cookie(env.session.cookieName, token, getSessionCookieOptions());

    res.status(200).json({
      success: true,
      data: {
        user: authService.toPublicEmployee(employee),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.[env.session.cookieName];
    await authService.logoutByToken(token);
    clearSessionCookie(res);
    res.status(200).json({
      success: true,
      data: { message: 'Logged out' },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
}

module.exports = {
  login,
  logout,
  me,
};
