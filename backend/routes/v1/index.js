'use strict';

const express = require('express');
const authRoutes = require('./auth.routes');
const attendanceRoutes = require('./attendance.routes');
const leavesRoutes = require('./leaves.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leavesRoutes);

module.exports = router;
