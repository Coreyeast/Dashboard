FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# --- Production image ---
FROM node:20-alpine

WORKDIR /app

# Copy the built output, package manifest, and default config
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/config ./config
RUN npm install --omit=dev

EXPOSE 3001

# adapter-node writes output to build/index.js
CMD ["node", "build"]
