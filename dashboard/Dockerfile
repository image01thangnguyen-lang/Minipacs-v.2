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

# IMPORTANT: During build time, Next.js might need placeholders for NEXT_PUBLIC vars
ENV NEXT_PUBLIC_OHIF_URL="http://localhost:3000"

# Build the application
RUN npm run build

# Start the application
EXPOSE 3000
CMD ["npm", "start"]
