'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [{
      name: 'Admininstrator',
      email: 'admin@example.com',
      password: '$2b$10$igY1TgWnOgPOt1M03An6..nmrhRoQn.eBGgij7pHoH8xTZZAWLC4a', 
      created_at: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: 'admin@example.com' }, {});
  }
};
