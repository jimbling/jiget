'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contact_group_members', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
      group_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'contact_groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      added_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      }
    });

    // unique constraint supaya 1 contact tidak double di grup yang sama
    await queryInterface.addConstraint('contact_group_members', {
      fields: ['contact_id', 'group_id'],
      type: 'unique',
      name: 'unique_contact_group'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('contact_group_members');
  }
};
