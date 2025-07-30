# M7Rnetworking Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY server/package*.json ./server/
COPY package*.json ./

# Install dependencies
RUN cd server && npm ci --only=production

# Copy application code
COPY server/ ./server/
COPY client/ ./client/
COPY .env ./

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start the application
CMD ["node", "server/index.js"]
