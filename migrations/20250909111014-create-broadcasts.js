'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('broadcasts', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
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
        defaultValue: 'pending'
      },
      target_type: {
        type: Sequelize.ENUM('all', 'group', 'custom_list'),
        allowNull: false,
        defaultValue: 'all'
      },
      target_ids: {
        type: Sequelize.JSON,
        allowNull: true, // simpan array id grup/kontak
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      executed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('broadcasts');
  }
};
