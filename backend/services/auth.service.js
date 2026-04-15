'use strict';

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Employee, Session } = require('../models');
const env = require('../config/env');

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function isIdleExpired(lastActivityAt) {
  const last = new Date(lastActivityAt).getTime();
  return Date.now() - last > env.session.idleMs;
}

function toPublicEmployee(employee) {
  if (!employee) return null;
  return {
    id: employee.id,
    username: employee.username,
    full_name: employee.full_name,
    email: employee.email,
    is_active: employee.is_active,
  };
}

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ token: string, employee: import('sequelize').Model }>}
 */
async function login(username, password) {
  const trimmedUsername = typeof username === 'string' ? username.trim() : '';

  if (!trimmedUsername || !password) {
    const err = new Error('Username and password are required');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const employee = await Employee.findOne({
    where: { username: trimmedUsername },
  });

  if (!employee || !employee.is_active) {
    const err = new Error('Invalid username or password');
    err.status = 401;
    err.code = 'AUTH_INVALID';
    throw err;
  }

  const match = await bcrypt.compare(password, employee.password_hash);
  if (!match) {
    const err = new Error('Invalid username or password');
    err.status = 401;
    err.code = 'AUTH_INVALID';
    throw err;
  }

  await Session.destroy({ where: { employee_id: employee.id } });

  const token = generateSessionToken();
  const token_hash = hashSessionToken(token);
  const now = new Date();

  await Session.create({
    employee_id: employee.id,
    token_hash,
    last_activity_at: now,
  });

  return { token, employee };
}

/**
 * @param {string} token
 * @returns {Promise<null | { session: import('sequelize').Model, employee: import('sequelize').Model }>}
 */
async function resolveSession(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const token_hash = hashSessionToken(token);

  const session = await Session.findOne({
    where: { token_hash },
    include: [{ model: Employee, as: 'employee', required: true }],
  });

  if (!session) {
    return null;
  }

  const employee = session.employee;
  if (!employee || !employee.is_active) {
    await session.destroy();
    return null;
  }

  if (isIdleExpired(session.last_activity_at)) {
    await session.destroy();
    return null;
  }

  const now = new Date();
  await session.update({ last_activity_at: now });

  return { session, employee };
}

/**
 * @param {string} token
 */
async function logoutByToken(token) {
  if (!token || typeof token !== 'string') {
    return;
  }
  const token_hash = hashSessionToken(token);
  await Session.destroy({ where: { token_hash } });
}

module.exports = {
  login,
  resolveSession,
  logoutByToken,
  toPublicEmployee,
};
