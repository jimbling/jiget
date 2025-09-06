'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {}
  }

  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true, // <- pakai timestamps
    createdAt: 'created_at', // <- sesuaikan dengan nama kolom di DB
    updatedAt: false        // <- kalau memang tidak ada kolom updated_at
  });

  return User;
};
