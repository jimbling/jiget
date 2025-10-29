# Gunakan image Node.js versi 20 yang ringan
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /app

# Copy file package.json & package-lock.json dulu
COPY package*.json ./

# Install dependencies (termasuk sequelize-cli)
RUN npm install --production

# Copy seluruh source code ke dalam container
COPY . .

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set environment variable default
ENV NODE_ENV=production
ENV PORT=3000

# Expose port aplikasi
EXPOSE 3000

# Gunakan entrypoint custom (untuk migrate + seeder)
ENTRYPOINT ["docker-entrypoint.sh"]
