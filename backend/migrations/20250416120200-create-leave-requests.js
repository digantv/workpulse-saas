'use strict';

/** @param {import('sequelize').QueryInterface} queryInterface */
/** @param {import('sequelize').Sequelize} Sequelize */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leave_requests', {
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
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      leave_type: {
        type: Sequelize.ENUM('SICK', 'CASUAL', 'PAID', 'UNPAID'),
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
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

    await queryInterface.addIndex('leave_requests', ['employee_id'], {
      name: 'leave_requests_employee_id_idx',
    });

    await queryInterface.addIndex('leave_requests', ['start_date', 'end_date'], {
      name: 'leave_requests_date_range_idx',
    });

    await queryInterface.addIndex('leave_requests', ['status'], {
      name: 'leave_requests_status_idx',
    });

    await queryInterface.addIndex('leave_requests', ['leave_type'], {
      name: 'leave_requests_leave_type_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('leave_requests');
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_leave_requests_leave_type";'
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_leave_requests_status";'
      );
    }
  },
};
