# Use Node.js LTS
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Expose the port your server.js uses
EXPOSE 5000

# The startup command
CMD ["node", "server.js"]