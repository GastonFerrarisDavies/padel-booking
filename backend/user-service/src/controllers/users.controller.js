'use strict';

const userService = require('../services/user.service');
const { HttpError } = require('../utils/http-error');

async function list(req, res) {
  const { role, search } = req.query;
  res.json(await userService.list({ role: role || undefined, search: search?.trim() || undefined }));
}

async function getById(req, res) {
  const user = await userService.findById(req.params.id);
  if (!user) throw new HttpError(404, 'user not found');
  res.json(user);
}

async function update(req, res) {
  const { role, active } = req.body ?? {};
  res.json(await userService.update(req.user, req.params.id, { role, active }));
}

async function stats(req, res) {
  res.json(await userService.stats());
}

module.exports = { list, getById, update, stats };
