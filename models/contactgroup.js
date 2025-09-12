'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ContactGroup extends Model {
    static associate(models) {
      ContactGroup.belongsToMany(models.Contact, {
        through: models.ContactGroupMember,
        foreignKey: 'group_id',
        otherKey: 'contact_id',
        as: 'contacts'
      });
    }
  }

  ContactGroup.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT
    },
    {
      sequelize,
      modelName: 'ContactGroup',
      tableName: 'contact_groups',
      underscored: true,
    }
  );

  return ContactGroup;
};
