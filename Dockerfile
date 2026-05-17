# Development stage
FROM node:20-alpine AS dev

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev)
RUN pnpm install

# Copy source code
COPY . .

EXPOSE 3000

# Development server with turbopack
CMD ["npx", "next", "dev", "--turbopack"]

# Builder stage for production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production runtime stage
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm in production image
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {if (r.statusCode < 200 || r.statusCode >= 400) throw new Error(r.statusCode)})"

# Start the application
CMD ["pnpm", "start"]
