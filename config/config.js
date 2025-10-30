require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'jiget_user',
    password: process.env.DB_PASS || 'jiget_pass',
    database: process.env.DB_NAME || 'db_jiget',
    host: process.env.DB_HOST || 'mariadb',
    dialect: 'mariadb'
  },
  production: {
    username: process.env.DB_USER || 'jiget_user',
    password: process.env.DB_PASS || 'jiget_pass',
    database: process.env.DB_NAME || 'db_jiget',
    host: process.env.DB_HOST || 'mariadb',
    dialect: 'mariadb'
  }
};
