'use strict';

const crypto = require('node:crypto');
const { pool } = require('../config/database');
const { HttpError } = require('../utils/http-error');

const ROLES = Object.freeze(['OWNER', 'ADMIN', 'PLAYER']);

const PUBLIC_COLUMNS = 'id, name, email, role, active, created_at';

// Shape expected by the frontend (entity/user.js).
function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    active: Boolean(row.active),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function findById(id) {
  const [rows] = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`, [id]);
  return rows[0] ? toUser(rows[0]) : null;
}

/** Includes password_hash: only for credential checks, never returned to clients. */
async function findCredentialsByEmail(email) {
  const [rows] = await pool.query(`SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = ?`, [email]);
  return rows[0] ?? null;
}

async function list({ role, search } = {}) {
  const where = [];
  const params = [];
  if (role) {
    if (!ROLES.includes(role)) throw new HttpError(400, `role must be one of ${ROLES.join(', ')}`);
    where.push('role = ?');
    params.push(role);
  }
  if (search) {
    where.push('(name LIKE ? OR email LIKE ?)');
    const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    params.push(pattern, pattern);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM users ${whereSql} ORDER BY created_at DESC`, params);
  return rows.map(toUser);
}

async function create({ name, email, passwordHash, role = 'PLAYER' }) {
  const id = crypto.randomUUID();
  try {
    await pool.query('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', [
      id,
      name,
      email,
      passwordHash,
      role,
    ]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'email already registered');
    throw err;
  }
  return findById(id);
}

/**
 * PATCH /users/:id — `{ role }` and/or `{ active }`.
 * Rules (mirror UsersManager.jsx): nobody edits themselves or an OWNER,
 * and only an OWNER changes roles (and cannot grant OWNER).
 */
async function update(actor, id, { role, active }) {
  if (role === undefined && active === undefined) throw new HttpError(400, 'nothing to update (role or active)');
  if (role !== undefined && !['ADMIN', 'PLAYER'].includes(role)) throw new HttpError(400, 'role must be ADMIN or PLAYER');
  if (active !== undefined && typeof active !== 'boolean') throw new HttpError(400, 'active must be a boolean');

  if (actor.id === id) throw new HttpError(403, 'you cannot modify your own account');
  if (role !== undefined && actor.role !== 'OWNER') throw new HttpError(403, 'only an OWNER can change roles');

  const target = await findById(id);
  if (!target) throw new HttpError(404, 'user not found');
  if (target.role === 'OWNER') throw new HttpError(403, 'an OWNER account cannot be modified');

  const sets = [];
  const params = [];
  if (role !== undefined) {
    sets.push('role = ?');
    params.push(role);
  }
  if (active !== undefined) {
    sets.push('active = ?');
    params.push(active);
  }
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  return findById(id);
}

module.exports = { ROLES, toUser, findById, findCredentialsByEmail, list, create, update };
