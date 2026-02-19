# Stage 1: Build/Development
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Industry Standard: use 'npm ci' for predictable, clean installs in CI/CD
RUN npm ci 
COPY . .

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
# Only copy necessary files from the builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 5000
# Best Practice: Don't run as root for security
USER node 
CMD ["node", "server.js"]