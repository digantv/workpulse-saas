'use strict';

const leaveService = require('../services/leave.service');

function employeeId(req) {
  return req.user?.id || req.employee?.id;
}

async function create(req, res, next) {
  try {
    const id = employeeId(req);
    const leave = await leaveService.createLeave(id, req.body || {});
    res.status(201).json({
      success: true,
      data: { leave },
    });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const id = employeeId(req);
    const leaves = await leaveService.listOwnLeaves(id, req.query || {});
    res.status(200).json({
      success: true,
      data: { leaves },
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const id = employeeId(req);
    const leave = await leaveService.getOwnLeaveById(id, req.params.id);
    res.status(200).json({
      success: true,
      data: { leave },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  getById,
};
