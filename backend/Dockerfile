# ===========================================================================
# MyCryptoCoin Backend — Multi-stage Docker Build
#
# Stage 1: Install dependencies + build TypeScript
# Stage 2: Production image with minimal footprint
# ===========================================================================

# ---- Build stage ----------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files first (Docker layer cache)
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install all dependencies (including devDeps for build)
RUN npm ci --ignore-scripts && \
    npx prisma generate

# Copy source
COPY tsconfig.json ./
COPY src ./src/

# Build TypeScript
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# ---- Production stage -----------------------------------------------------
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    tini \
    curl \
    postgresql-client \
    && rm -rf /var/cache/apk/*

# Copy built application from builder
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

# Create log directory
RUN mkdir -p /app/logs && chown appuser:appgroup /app/logs

# Switch to non-root user
USER appuser

# Environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Use tini for proper signal handling (SIGTERM graceful shutdown)
ENTRYPOINT ["tini", "--"]

# Start application
CMD ["node", "dist/app.js"]
