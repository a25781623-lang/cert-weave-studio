# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
# Copy lockfiles first for better caching
COPY package*.json ./
RUN npm ci --production
COPY . .

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app ./
ENV NODE_ENV=production
EXPOSE 5000
# Best Practice: Run as non-root user
USER node
CMD ["node", "server.js"]