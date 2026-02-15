# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage: Node server serves static files + /api/status (no CORS)
FROM node:20-alpine

WORKDIR /app

COPY server.js ./
COPY --from=builder /app/dist ./dist

# config.yaml can be mounted at /app/dist/config.yaml at runtime
ENV PORT=80
EXPOSE 80

CMD ["node", "server.js"]
