FROM node:18-alpine

# NEXT_PUBLIC_* values are compiled into the browser bundle by Next.js. They
# must therefore be supplied during `docker build`; runtime-only environment
# variables cannot toggle an already-built image.
ARG NEXT_PUBLIC_PHASE4_WORKSPACE=false
ARG NEXT_PUBLIC_ENABLE_REPORT_PANEL=false
ENV NEXT_PUBLIC_PHASE4_WORKSPACE=${NEXT_PUBLIC_PHASE4_WORKSPACE}
ENV NEXT_PUBLIC_ENABLE_REPORT_PANEL=${NEXT_PUBLIC_ENABLE_REPORT_PANEL}

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
