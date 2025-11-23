FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev=false

# Copy source
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Build
RUN npm run build

# ---- Production runtime image ----
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy any assets needed at runtime (if any)

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "dist/main.js"]
