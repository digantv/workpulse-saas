'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Session = sequelize.define(
  'Session',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    token_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    last_activity_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'sessions',
    underscored: true,
  }
);

module.exports = Session;
