'use strict';

const express = require('express');
const authController = require('../../controllers/auth.controller');
const { protectAuth } = require('../../middlewares/protect-auth');

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', protectAuth, authController.me);

module.exports = router;
