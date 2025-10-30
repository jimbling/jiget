'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('wa_tokens', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'device_id'
    });

    await queryInterface.addColumn('wa_tokens', 'device_name', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'phone'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('wa_tokens', 'phone');
    await queryInterface.removeColumn('wa_tokens', 'device_name');
  }
};
