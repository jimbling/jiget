# Gunakan image Node.js versi 20 yang ringan
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /app

# Copy file package.json & package-lock.json dulu
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy seluruh source code ke dalam container
COPY . .

# Set environment variable (bisa diganti via .env nanti)
ENV NODE_ENV=production
ENV PORT=3000

# Expose port 3000 agar bisa diakses
EXPOSE 3000

# Jalankan aplikasi (ganti index.js jika berbeda)
CMD ["node", "index.js"]
