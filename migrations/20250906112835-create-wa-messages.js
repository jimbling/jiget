'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wa_messages', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Isi pesan',
      },
      media_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_media: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      media_type: {
        type: Sequelize.ENUM('text', 'image', 'video', 'document', 'audio', 'sticker'),
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM('outbound', 'inbound'),
        allowNull: false,
        defaultValue: 'outbound',
        comment: 'Jenis pesan',
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed', 'received'),
        allowNull: true,
      },
      response: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Response dari WA Gateway',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('wa_messages');
  }
};