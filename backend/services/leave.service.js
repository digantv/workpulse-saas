'use strict';

const { LeaveRequest } = require('../models');

const LEAVE_TYPES = new Set(['SICK', 'CASUAL', 'PAID', 'UNPAID']);
const STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED']);

function parseDateOnly(value, fieldName) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const err = new Error(`${fieldName} must be YYYY-MM-DD`);
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  const t = new Date(`${value}T12:00:00.000Z`).getTime();
  if (Number.isNaN(t)) {
    const err = new Error(`${fieldName} is not a valid date`);
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  return value;
}

function toLeaveDto(row) {
  const plain = row.get ? row.get({ plain: true }) : row;
  return {
    id: plain.id,
    employee_id: plain.employee_id,
    start_date: plain.start_date,
    end_date: plain.end_date,
    leave_type: plain.leave_type,
    reason: plain.reason,
    status: plain.status,
    created_at: plain.createdAt ?? plain.created_at,
    updated_at: plain.updatedAt ?? plain.updated_at,
  };
}

/**
 * @param {string} employeeId
 * @param {{ start_date: unknown, end_date: unknown, leave_type: unknown, reason: unknown }} body
 */
async function createLeave(employeeId, body) {
  const startRaw = body?.start_date;
  const endRaw = body?.end_date;
  const leaveType = body?.leave_type;
  const reason = body?.reason;

  const start_date = parseDateOnly(startRaw, 'start_date');
  const end_date = parseDateOnly(endRaw, 'end_date');

  if (start_date > end_date) {
    const err = new Error('end_date cannot be before start_date');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (typeof leaveType !== 'string' || !LEAVE_TYPES.has(leaveType)) {
    const err = new Error(
      'leave_type must be one of: SICK, CASUAL, PAID, UNPAID'
    );
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (typeof reason !== 'string' || reason.trim().length === 0) {
    const err = new Error('reason is required');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const row = await LeaveRequest.create({
    employee_id: employeeId,
    start_date,
    end_date,
    leave_type: leaveType,
    reason: reason.trim(),
    status: 'PENDING',
  });

  return toLeaveDto(row);
}

/**
 * @param {string} employeeId
 * @param {{ status?: string }} query
 */
async function listOwnLeaves(employeeId, query) {
  const where = { employee_id: employeeId };

  const status = query?.status;
  if (status !== undefined && status !== '') {
    if (typeof status !== 'string' || !STATUSES.has(status)) {
      const err = new Error(
        'status filter must be one of: PENDING, APPROVED, REJECTED'
      );
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    where.status = status;
  }

  const rows = await LeaveRequest.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });

  return rows.map(toLeaveDto);
}

/**
 * @param {string} employeeId
 * @param {string} id
 */
async function getOwnLeaveById(employeeId, id) {
  if (
    typeof id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    )
  ) {
    const err = new Error('Invalid leave request id');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const row = await LeaveRequest.findOne({
    where: {
      id,
      employee_id: employeeId,
    },
  });

  if (!row) {
    const err = new Error('Leave request not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return toLeaveDto(row);
}

module.exports = {
  createLeave,
  listOwnLeaves,
  getOwnLeaveById,
};
