'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('broadcasts', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'done', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      target_type: {
        type: Sequelize.ENUM('all', 'group', 'contact', 'custom_list'),
        allowNull: false,
      },
      target_ids: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      executed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('broadcasts');
  }
};