#!/bin/sh

echo "Menunggu database di $DB_HOST:3306 siap..."
# Tunggu sampai MariaDB siap menerima koneksi
until nc -z $DB_HOST 3306; do
  sleep 2
done

echo "Database siap! Jalankan migrasi & seeder..."
npx sequelize db:migrate
npx sequelize db:seed:all

echo "Menjalankan aplikasi Node.js..."
exec node index.js
