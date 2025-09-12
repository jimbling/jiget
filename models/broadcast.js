'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Broadcast extends Model {
    static associate(models) {
      Broadcast.hasMany(models.BroadcastLog, {
        foreignKey: 'broadcast_id',
        as: 'logs'
      });
    }
  }

  Broadcast.init(
    {
      title: DataTypes.STRING,
      message: DataTypes.TEXT,
      status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'done', 'failed'),
        defaultValue: 'pending'
      },
      target_type: {
        type: DataTypes.ENUM('all', 'group', 'custom_list'),
        defaultValue: 'all'
      },
      target_ids: DataTypes.JSON,
      executed_at: DataTypes.DATE
    },
    {
      sequelize,
      modelName: 'Broadcast',
      tableName: 'broadcasts',
      underscored: true,
    }
  );

  return Broadcast;
};
