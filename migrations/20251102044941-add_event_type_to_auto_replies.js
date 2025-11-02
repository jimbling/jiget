'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('auto_replies', 'event_type', {
      type: Sequelize.ENUM('message', 'welcome', 'farewell'),
      allowNull: false,
      defaultValue: 'message',
      after: 'type',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('auto_replies', 'event_type');
  }
};
