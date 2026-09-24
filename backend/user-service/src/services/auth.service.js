'use strict';

const jwt = require('jsonwebtoken');
const { config } = require('../config');
const userService = require('./user.service');
const { hashPassword, verifyPassword } = require('../utils/password');
const { HttpError } = require('../utils/http-error');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

function signToken(user) {
  return jwt.sign({ role: user.role }, config.jwt.secret, {
    subject: user.id,
    expiresIn: config.jwt.expiresIn,
    algorithm: 'HS256',
  });
}

/** @returns {{ sub: string, role: string }} */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
  } catch {
    throw new HttpError(401, 'invalid or expired token');
  }
}

async function login({ email, password }) {
  const normalized = normalizeEmail(email);
  if (!normalized || typeof password !== 'string' || !password) {
    throw new HttpError(400, 'email and password are required');
  }

  const row = await userService.findCredentialsByEmail(normalized);
  // Same message for unknown email and wrong password: don't reveal which accounts exist.
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    throw new HttpError(401, 'invalid email or password');
  }
  if (!row.active) throw new HttpError(403, 'account is disabled');

  const user = userService.toUser(row);
  return { token: signToken(user), user };
}

/** Public sign-up: always creates a PLAYER. */
async function register({ name, email, password }) {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const normalized = normalizeEmail(email);
  if (!trimmedName) throw new HttpError(400, 'name is required');
  if (!EMAIL_PATTERN.test(normalized)) throw new HttpError(400, 'a valid email is required');
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const user = await userService.create({
    name: trimmedName,
    email: normalized,
    passwordHash: await hashPassword(password),
  });
  return { token: signToken(user), user };
}

module.exports = { login, register, verifyToken };
