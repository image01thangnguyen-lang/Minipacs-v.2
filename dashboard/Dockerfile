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

# The Docker build context is the repository root (see docker-compose.yml), so
# the image can carry the release flags used by server-rendered AntD cutovers.
# Keeping a copy in the image prevents a standalone/recreated container from
# silently falling back to legacy UI when the optional runtime mount is absent.

# Set working directory
WORKDIR /app

# Copy dependencies
COPY dashboard/package*.json ./
# Use the committed lockfile for deterministic builds. cssinjs is an explicit
# dependency because @ant-design/nextjs-registry imports it at build/runtime.
RUN npm ci --legacy-peer-deps

# Copy application code and the production release configuration.
COPY dashboard/ .
COPY config/release/ /config/release/

# Build the application
RUN npm run build

# Start the application
EXPOSE 3000
CMD ["npm", "start"]
