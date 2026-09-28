'use strict';

const { clerkClient } = require('@clerk/express');
const { pool } = require('../config/database');
const { config } = require('../config');
const { HttpError } = require('../utils/http-error');

const ROLES = Object.freeze(['OWNER', 'ADMIN', 'PLAYER']);

// Clerk caps page size at 500; MAX_LISTED bounds how many users one request walks.
const CLERK_PAGE_SIZE = 500;
const MAX_LISTED = 5000;

// A Clerk user with no row yet has never called the API: they are an active PLAYER.
const DEFAULT_ACCESS = Object.freeze({ role: 'PLAYER', active: true });

/* -------------------------------------------------------------------------- */
/*  Authorization rows (user_roles)                                            */
/* -------------------------------------------------------------------------- */

function toAccess(row) {
  return {
    id: row.clerk_id,
    role: row.role,
    active: Boolean(row.active),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function findAccess(clerkId) {
  const [rows] = await pool.query('SELECT clerk_id, role, active, created_at FROM user_roles WHERE clerk_id = ?', [clerkId]);
  return rows[0] ? toAccess(rows[0]) : null;
}

/** @returns {Promise<Map<string, { role: string, active: boolean }>>} */
async function findAccessMap(clerkIds) {
  if (clerkIds.length === 0) return new Map();
  const [rows] = await pool.query('SELECT clerk_id, role, active, created_at FROM user_roles WHERE clerk_id IN (?)', [clerkIds]);
  return new Map(rows.map((row) => [row.clerk_id, toAccess(row)]));
}

/* -------------------------------------------------------------------------- */
/*  Clerk (identity)                                                           */
/* -------------------------------------------------------------------------- */

async function getClerkUser(clerkId) {
  try {
    return await clerkClient.users.getUser(clerkId);
  } catch (err) {
    if (err?.status === 404) return null;
    throw err;
  }
}

function primaryEmail(clerkUser) {
  return clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses?.[0]?.emailAddress ?? '';
}

// Shape expected by the frontend (api/entity/user.js).
function toUser(clerkUser, access) {
  const email = primaryEmail(clerkUser);
  const { role, active } = access ?? DEFAULT_ACCESS;
  return {
    id: clerkUser.id,
    name: clerkUser.fullName || clerkUser.username || email,
    email,
    role,
    active,
    createdAt: new Date(clerkUser.createdAt).toISOString(),
  };
}

/**
 * Walks Clerk's user list newest first. `stopWhen(user)` ends the walk early
 * (the list is ordered by creation, so date cut-offs can stop paging).
 */
async function listClerkUsers({ query, stopWhen } = {}) {
  const users = [];
  for (let offset = 0; offset < MAX_LISTED; offset += CLERK_PAGE_SIZE) {
    const { data } = await clerkClient.users.getUserList({ query, orderBy: '-created_at', limit: CLERK_PAGE_SIZE, offset });
    for (const user of data) {
      if (stopWhen?.(user)) return users;
      users.push(user);
    }
    if (data.length < CLERK_PAGE_SIZE) break;
  }
  return users;
}

/* -------------------------------------------------------------------------- */
/*  Provisioning                                                               */
/* -------------------------------------------------------------------------- */

async function ownerExists() {
  const [rows] = await pool.query("SELECT 1 FROM user_roles WHERE role = 'OWNER' LIMIT 1");
  return rows.length > 0;
}

// OWNER_EMAIL bootstraps the first OWNER: only a verified primary email counts.
async function initialRole(clerkId) {
  if (!config.ownerEmail || (await ownerExists())) return 'PLAYER';

  const clerkUser = await getClerkUser(clerkId);
  const email = clerkUser?.primaryEmailAddress;
  const isOwner = email?.verification?.status === 'verified' && email.emailAddress.toLowerCase() === config.ownerEmail;
  return isOwner ? 'OWNER' : 'PLAYER';
}

/** Returns the user's authorization row, creating it on their first API call. */
async function ensureAccess(clerkId) {
  const existing = await findAccess(clerkId);
  if (existing) return existing;

  // INSERT IGNORE: parallel first requests (or replicas) may race; the PK keeps one row.
  await pool.query('INSERT IGNORE INTO user_roles (clerk_id, role) VALUES (?, ?)', [clerkId, await initialRole(clerkId)]);
  return findAccess(clerkId);
}

/* -------------------------------------------------------------------------- */
/*  Queries used by the controllers                                            */
/* -------------------------------------------------------------------------- */

async function findById(clerkId) {
  const clerkUser = await getClerkUser(clerkId);
  return clerkUser ? toUser(clerkUser, await findAccess(clerkId)) : null;
}

async function list({ role, search } = {}) {
  if (role && !ROLES.includes(role)) throw new HttpError(400, `role must be one of ${ROLES.join(', ')}`);

  const clerkUsers = await listClerkUsers({ query: search });
  const accessById = await findAccessMap(clerkUsers.map((user) => user.id));
  const users = clerkUsers.map((user) => toUser(user, accessById.get(user.id)));
  return role ? users.filter((user) => user.role === role) : users;
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

  const clerkUser = await getClerkUser(id);
  if (!clerkUser) throw new HttpError(404, 'user not found');
  const target = await ensureAccess(id);
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
  await pool.query(`UPDATE user_roles SET ${sets.join(', ')} WHERE clerk_id = ?`, [...params, id]);
  return toUser(clerkUser, await findAccess(id));
}

/** % change rounded to one decimal; 0 without a baseline. */
function percentDelta(current, previous) {
  return previous === 0 ? 0 : Math.round(((current - previous) / previous) * 1000) / 10;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** GET /users/stats — new PLAYER accounts (Clerk sign-ups) in the last 7 days vs. the 7 days before. */
async function stats() {
  const now = Date.now();
  const weekAgo = now - 7 * DAY_MS;
  const twoWeeksAgo = now - 14 * DAY_MS;

  const recent = await listClerkUsers({ stopWhen: (user) => user.createdAt < twoWeeksAgo });
  const accessById = await findAccessMap(recent.map((user) => user.id));
  const players = recent.filter((user) => (accessById.get(user.id) ?? DEFAULT_ACCESS).role === 'PLAYER');

  const current = players.filter((user) => user.createdAt >= weekAgo).length;
  const previous = players.length - current;
  return { newUsers: current, newUsersDelta: percentDelta(current, previous) };
}

module.exports = { ROLES, ensureAccess, findById, list, update, stats };
