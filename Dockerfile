# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy source files
COPY . .

# Test, dann bauen - ein roter Test verhindert das Image
RUN npm test && npm run build

# Laufzeit: Node-Server liefert dist/ und /api/* (Status aus Prometheus)
FROM node:22-alpine

WORKDIR /app

COPY server.js ./
COPY --from=builder /app/dist ./dist

# Zur Laufzeit einhaengen:
#   config:     -v /pfad/config.yaml:/app/dist/config.yaml:ro
#   icons:      -v /pfad/icons:/app/dist/icons:ro
#   diagramme:  -v /pfad/diagrams:/app/dist/diagrams:ro
# und PROMETHEUS_URL setzen (Standard http://prometheus:9090).
ENV PORT=8080 PROMETHEUS_URL=http://prometheus:9090
USER node
EXPOSE 8080

CMD ["node", "server.js"]
