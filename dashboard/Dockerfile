FROM node:18-alpine

# Install system dependencies required by Prisma in Alpine Linux
RUN apk add --no-cache libc6-compat openssl

# Set working directory
WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Start the application
EXPOSE 3000
CMD ["npm", "start"]
