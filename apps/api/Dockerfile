FROM node:22-alpine AS builder

WORKDIR /workspace

# Copy root package files for workspace setup
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY nx.json ./

# Copy app and lib source
COPY apps/api/ ./apps/api/
COPY libs/shared-types/ ./libs/shared-types/

# Install all dependencies
RUN npm ci --ignore-scripts

# Build the API
RUN npx nx build api --configuration=production

# ---- Runtime image ----
FROM node:22-alpine

WORKDIR /app

# Copy built output
COPY --from=builder /workspace/apps/api/dist/ ./

# Copy and install only production deps
COPY --from=builder /workspace/apps/api/package.json ./package.json
COPY --from=builder /workspace/package-lock.json ./package-lock.json
RUN npm ci --omit=dev --ignore-scripts

# Create data directory for SQLite
RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/vidflix.db

EXPOSE 3000

CMD ["node", "main.js"]
