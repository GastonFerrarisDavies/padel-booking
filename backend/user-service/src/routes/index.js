'use strict';

const { Router } = require('express');
const healthRoutes = require('./health.routes');

const router = Router();

router.use('/health-check', healthRoutes);
// Register new feature routers here, e.g. router.use('/users', userRoutes);

module.exports = router;
