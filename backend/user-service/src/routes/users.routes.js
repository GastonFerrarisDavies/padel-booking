'use strict';

const { Router } = require('express');
const usersController = require('../controllers/users.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = Router();

// User administration is dashboard-only (OWNER / ADMIN).
router.use(authenticate, requireRole('OWNER', 'ADMIN'));

router.get('/', usersController.list);
router.get('/:id', usersController.getById);
router.patch('/:id', usersController.update);

module.exports = router;
