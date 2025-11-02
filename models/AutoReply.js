'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AutoReply extends Model {
    static associate(models) {
      // bisa nanti ditambah relasi ke log, dsb
    }
  }

  AutoReply.init({
    keyword: DataTypes.STRING,
    type: {
      type: DataTypes.ENUM('exact', 'contains', 'regex'),
      defaultValue: 'contains'
    },
    event_type: {
      type: DataTypes.ENUM('message', 'welcome', 'farewell'),
      defaultValue: 'message'
    },
    reply_text: DataTypes.TEXT,
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'AutoReply',
    tableName: 'auto_replies',
    underscored: true,
  });

  return AutoReply;
};
