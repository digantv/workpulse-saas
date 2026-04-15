'use strict';

/** @param {import('sequelize').QueryInterface} queryInterface */
/** @param {import('sequelize').Sequelize} Sequelize */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendances', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      attendance_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      check_in: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      check_out: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      total_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PRESENT', 'ABSENT', 'HALF_DAY'),
        allowNull: false,
        defaultValue: 'PRESENT',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex(
      'attendances',
      ['employee_id', 'attendance_date'],
      {
        unique: true,
        name: 'attendances_employee_id_attendance_date_unique',
      }
    );

    await queryInterface.addIndex('attendances', ['employee_id'], {
      name: 'attendances_employee_id_idx',
    });

    await queryInterface.addIndex('attendances', ['attendance_date'], {
      name: 'attendances_attendance_date_idx',
    });

    await queryInterface.addIndex('attendances', ['status'], {
      name: 'attendances_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('attendances');
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_attendances_status";'
      );
    }
  },
};
