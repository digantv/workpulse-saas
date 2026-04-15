'use strict';

const { sequelize } = require('../config/database');
const Employee = require('./employee');
const Session = require('./session');
const Attendance = require('./attendance');
const LeaveRequest = require('./leave_request');

Employee.hasMany(Session, {
  foreignKey: 'employee_id',
  as: 'sessions',
  onDelete: 'CASCADE',
});

Session.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee',
});

Employee.hasMany(Attendance, {
  foreignKey: 'employee_id',
  as: 'attendances',
  onDelete: 'CASCADE',
});

Attendance.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee',
});

Employee.hasMany(LeaveRequest, {
  foreignKey: 'employee_id',
  as: 'leaveRequests',
  onDelete: 'CASCADE',
});

LeaveRequest.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee',
});

module.exports = {
  sequelize,
  Employee,
  Session,
  Attendance,
  LeaveRequest,
};
