# Use Node.js 18 LTS as base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/ 2>/dev/null || true

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
COPY client/package*.json ./client/
RUN npm ci

# Copy source code
COPY . .

# Build the client
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Environment variables will be provided by Render

# Change ownership to nodejs user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"] 