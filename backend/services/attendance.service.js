'use strict';

const { Op } = require('sequelize');
const env = require('../config/env');
const { Attendance } = require('../models');

function getAttendanceTimezone() {
  return env.attendanceTimezone;
}

/**
 * Calendar date YYYY-MM-DD in the configured timezone (default UTC).
 */
function getTodayDateOnly() {
  const timeZone = getAttendanceTimezone();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year').value;
  const m = parts.find((p) => p.type === 'month').value;
  const d = parts.find((p) => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * @param {string} yyyyMm e.g. 2025-04
 * @returns {{ start: string, end: string }}
 */
function getMonthDateRange(yyyyMm) {
  const m = /^(\d{4})-(\d{2})$/.exec(yyyyMm);
  if (!m) {
    const err = new Error('Invalid month format. Use YYYY-MM');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  const y = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) {
    const err = new Error('Invalid month');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  const start = `${m[1]}-${m[2]}-01`;
  const lastDay = new Date(y, month, 0).getDate();
  const end = `${m[1]}-${m[2]}-${pad2(lastDay)}`;
  return { start, end };
}

function parseDateOnly(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return null;
  }
  const d = new Date(`${s}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return s;
}

/**
 * @param {string} employeeId
 */
async function findTodayRecord(employeeId) {
  const today = getTodayDateOnly();
  return Attendance.findOne({
    where: {
      employee_id: employeeId,
      attendance_date: today,
    },
  });
}

/**
 * @param {import('sequelize').Model} row
 */
function toAttendanceDto(row) {
  return {
    id: row.id,
    employee_id: row.employee_id,
    attendance_date: row.attendance_date,
    check_in: row.check_in,
    check_out: row.check_out,
    total_minutes: row.total_minutes,
    status: row.status,
  };
}

/**
 * @param {string} employeeId
 */
async function checkIn(employeeId) {
  const today = getTodayDateOnly();
  const existing = await Attendance.findOne({
    where: { employee_id: employeeId, attendance_date: today },
  });

  if (existing) {
    const err = new Error('Already checked in for this calendar day');
    err.status = 409;
    err.code = 'ATTENDANCE_ALREADY_CHECKED_IN';
    throw err;
  }

  const now = new Date();

  try {
    const row = await Attendance.create({
      employee_id: employeeId,
      attendance_date: today,
      check_in: now,
      check_out: null,
      total_minutes: null,
      status: 'PRESENT',
    });
    return toAttendanceDto(row);
  } catch (e) {
    if (
      e.name === 'SequelizeUniqueConstraintError' ||
      e.parent?.code === '23505'
    ) {
      const err = new Error('Already checked in for this calendar day');
      err.status = 409;
      err.code = 'ATTENDANCE_ALREADY_CHECKED_IN';
      throw err;
    }
    throw e;
  }
}

/**
 * @param {string} employeeId
 */
async function checkOut(employeeId) {
  const row = await findTodayRecord(employeeId);

  if (!row || !row.check_in) {
    const err = new Error('Check in required before check out');
    err.status = 400;
    err.code = 'ATTENDANCE_NOT_CHECKED_IN';
    throw err;
  }

  if (row.check_out) {
    const err = new Error('Already checked out for this calendar day');
    err.status = 409;
    err.code = 'ATTENDANCE_ALREADY_CHECKED_OUT';
    throw err;
  }

  const now = new Date();
  const checkInTime = new Date(row.check_in);
  const totalMs = now.getTime() - checkInTime.getTime();
  const totalMinutes = Math.max(0, Math.round(totalMs / 60000));

  await row.update({
    check_out: now,
    total_minutes: totalMinutes,
  });

  return toAttendanceDto(row);
}

/**
 * @param {string} employeeId
 */
async function getTodayState(employeeId) {
  const date = getTodayDateOnly();
  const row = await findTodayRecord(employeeId);

  if (!row) {
    return {
      date,
      status: 'NOT_CHECKED_IN',
      attendance: null,
    };
  }

  if (row.check_in && !row.check_out) {
    return {
      date,
      status: 'CHECKED_IN',
      attendance: toAttendanceDto(row),
    };
  }

  return {
    date,
    status: 'CHECKED_OUT',
    attendance: toAttendanceDto(row),
  };
}

/**
 * @param {string} employeeId
 * @param {{ month?: string, start_date?: string, end_date?: string }} query
 */
async function getTimesheet(employeeId, query) {
  const month = query.month;
  const startQ = query.start_date;
  const endQ = query.end_date;

  let start;
  let end;
  let filterMeta;

  if (month) {
    const range = getMonthDateRange(month);
    start = range.start;
    end = range.end;
    filterMeta = { type: 'month', value: month };
  } else if (startQ || endQ) {
    if (!startQ || !endQ) {
      const err = new Error(
        'Provide both start_date and end_date (YYYY-MM-DD), or use month=YYYY-MM'
      );
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    const sd = parseDateOnly(startQ);
    const ed = parseDateOnly(endQ);
    if (!sd || !ed) {
      const err = new Error('start_date and end_date must be YYYY-MM-DD');
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    if (sd > ed) {
      const err = new Error('start_date must be on or before end_date');
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    start = sd;
    end = ed;
    filterMeta = { type: 'range', start_date: sd, end_date: ed };
  } else {
    const today = getTodayDateOnly();
    const y = today.slice(0, 7);
    const range = getMonthDateRange(y);
    start = range.start;
    end = range.end;
    filterMeta = { type: 'month', value: y, default: true };
  }

  const rows = await Attendance.findAll({
    where: {
      employee_id: employeeId,
      attendance_date: {
        [Op.between]: [start, end],
      },
    },
    order: [['attendance_date', 'DESC']],
  });

  const records = rows.map((row) => {
    const dto = toAttendanceDto(row);
    const mins = row.total_minutes;
    return {
      ...dto,
      total_hours:
        mins == null ? null : Math.round((mins / 60) * 100) / 100,
    };
  });

  return {
    filter: filterMeta,
    timezone: getAttendanceTimezone(),
    records,
  };
}

module.exports = {
  getTodayDateOnly,
  getAttendanceTimezone,
  checkIn,
  checkOut,
  getTodayState,
  getTimesheet,
};
