FROM node:20-alpine

WORKDIR /app

# Build tools required for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

COPY . .
RUN npm ci
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "apps/api/dist/main.js"]
