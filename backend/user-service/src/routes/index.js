'use strict';

const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');

const router = Router();

router.use('/health-check', healthRoutes);
// The Ingress only forwards /api/(users|auth)* here, so the public health check
// is also exposed under /users; it must be mounted before the protected users router.
router.use('/users/health-check', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

module.exports = router;
