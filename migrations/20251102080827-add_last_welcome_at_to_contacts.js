'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('contacts', 'last_welcome_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Waktu terakhir welcome message dikirim'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('contacts', 'last_welcome_at');
  }
};
