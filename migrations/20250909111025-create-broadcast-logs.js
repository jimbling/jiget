'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('broadcast_logs', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      broadcast_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'broadcasts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      contact_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'contacts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('sent', 'delivered', 'read', 'failed'),
        allowNull: false,
        defaultValue: 'sent'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('broadcast_logs');
  }
};
