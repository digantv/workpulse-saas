'use strict';

const attendanceService = require('../services/attendance.service');

function employeeId(req) {
  return req.user?.id || req.employee?.id;
}

async function checkIn(req, res, next) {
  try {
    const id = employeeId(req);
    const attendance = await attendanceService.checkIn(id);
    res.status(201).json({
      success: true,
      data: { attendance },
    });
  } catch (err) {
    next(err);
  }
}

async function checkOut(req, res, next) {
  try {
    const id = employeeId(req);
    const attendance = await attendanceService.checkOut(id);
    res.status(200).json({
      success: true,
      data: { attendance },
    });
  } catch (err) {
    next(err);
  }
}

async function today(req, res, next) {
  try {
    const id = employeeId(req);
    const data = await attendanceService.getTodayState(id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

async function timesheet(req, res, next) {
  try {
    const id = employeeId(req);
    const data = await attendanceService.getTimesheet(id, {
      month: req.query.month,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
    });
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  checkIn,
  checkOut,
  today,
  timesheet,
};
