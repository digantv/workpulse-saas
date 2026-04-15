'use strict';

const env = require('../config/env');
const authService = require('../services/auth.service');

/**
 * Requires a valid session cookie. Refreshes last-activity (idle timeout) on each successful use.
 * Attaches `req.user` (public fields), `req.employee` (model), `req.sessionRecord` (session row).
 */
async function protectAuth(req, res, next) {
  try {
    const token = req.cookies?.[env.session.cookieName];
    const result = await authService.resolveSession(token);

    if (!result) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired session',
        },
      });
    }

    req.sessionRecord = result.session;
    req.employee = result.employee;
    req.user = authService.toPublicEmployee(result.employee);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { protectAuth };
