'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BroadcastLog extends Model {
    static associate(models) {
      BroadcastLog.belongsTo(models.Broadcast, {
        foreignKey: 'broadcast_id',
        as: 'broadcast'
      });

      BroadcastLog.belongsTo(models.Contact, {
        foreignKey: 'contact_id',
        as: 'contact'
      });
    }
  }

  BroadcastLog.init(
    {
      broadcast_id: DataTypes.BIGINT,
      contact_id: DataTypes.BIGINT,
      status: {
        type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed'),
        defaultValue: 'sent'
      },
      sent_at: DataTypes.DATE
    },
    {
      sequelize,
      modelName: 'BroadcastLog',
      tableName: 'broadcast_logs',
      underscored: true,
      timestamps: false
    }
  );

  return BroadcastLog;
};
