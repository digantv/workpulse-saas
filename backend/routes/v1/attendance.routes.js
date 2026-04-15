'use strict';

const express = require('express');
const attendanceController = require('../../controllers/attendance.controller');
const { protectAuth } = require('../../middlewares/protect-auth');

const router = express.Router();

router.use(protectAuth);

router.post('/checkin', attendanceController.checkIn);
router.post('/checkout', attendanceController.checkOut);
router.get('/today', attendanceController.today);
router.get('/timesheet', attendanceController.timesheet);

module.exports = router;
