'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Contact extends Model {
    static associate(models) {
      // Contact <-> ContactGroup (many-to-many via ContactGroupMember)
      Contact.belongsToMany(models.ContactGroup, {
        through: models.ContactGroupMember,
        foreignKey: 'contact_id',
        otherKey: 'group_id',
        as: 'groups'
      });

      // Contact -> BroadcastLogs (one-to-many)
      Contact.hasMany(models.BroadcastLog, {
        foreignKey: 'contact_id',
        as: 'broadcast_logs'
      });
    }
  }

  Contact.init(
    {
      name: DataTypes.STRING,
      phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      wa_id: DataTypes.STRING,
      tags: DataTypes.JSON,
      is_subscribed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      last_active_at: DataTypes.DATE
    },
    {
      sequelize,
      modelName: 'Contact',
      tableName: 'contacts',
      underscored: true,
    }
  );

  return Contact;
};
