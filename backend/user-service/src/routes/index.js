'use strict';

const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');

const router = Router();

router.use('/health-check', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

module.exports = router;
