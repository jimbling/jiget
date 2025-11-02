'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('contacts', 'last_active_at', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'is_subscribed',
    });

    await queryInterface.addColumn('contacts', 'is_welcome_sent', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      after: 'last_active_at',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('contacts', 'last_active_at');
    await queryInterface.removeColumn('contacts', 'is_welcome_sent');
  },
};
