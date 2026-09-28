'use strict';

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');

const router = Router();

// Sign-in / sign-up happen in Clerk; this service only resolves authorization.
router.get('/me', authenticate, authController.me);

module.exports = router;
