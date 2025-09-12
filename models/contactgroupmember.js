'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ContactGroupMember extends Model {
    static associate(models) {
      ContactGroupMember.belongsTo(models.Contact, {
        foreignKey: 'contact_id',
        as: 'contact'
      });

      ContactGroupMember.belongsTo(models.ContactGroup, {
        foreignKey: 'group_id',
        as: 'group'
      });
    }
  }

  ContactGroupMember.init(
    {
      contact_id: DataTypes.BIGINT,
      group_id: DataTypes.BIGINT,
      added_at: DataTypes.DATE
    },
    {
      sequelize,
      modelName: 'ContactGroupMember',
      tableName: 'contact_group_members',
      underscored: true,
      timestamps: false
    }
  );

  return ContactGroupMember;
};
