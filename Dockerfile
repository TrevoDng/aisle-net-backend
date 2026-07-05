# Build stage (compiles TypeScript)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Production stage (only run compiled code)
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Copy environment files
COPY .env* ./
#COPY .env.docker ./.env.docker

# Expose port
EXPOSE 3001

# Command to run compiled server
CMD ["node", "dist/server.js"]