// src/server.ts
import dotenv from 'dotenv';
import path from 'path';

// ======================================================
// ⚠️ IMPORTANT: Load environment variables FIRST
// BEFORE importing any other modules
// ======================================================

// Load appropriate .env file based on environment
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.resolve(process.cwd(), envFile);

// Check if we're running in Docker
const isDocker = process.env.DB_HOST === 'postgres' || process.env.REDIS_HOST === 'redis';
const dockerEnvFile = isDocker ? '.env.docker' : null;

// Load the appropriate env file
if (isDocker && dockerEnvFile) {
  const dockerEnvPath = path.resolve(process.cwd(), dockerEnvFile);
  console.log(`🐳 Running in Docker mode - loading: ${dockerEnvFile}`);
  dotenv.config({ path: dockerEnvPath });
} else {
  console.log(`📝 Loading environment from: ${envFile}`);
  dotenv.config({ path: envPath });
}

// If no env loaded, try loading from .env as fallback
if (!process.env.DB_HOST) {
  console.log('⚠️ No environment variables found, loading .env as fallback');
  dotenv.config();
}

// Now import the rest AFTER environment is loaded
import { User as UserModel } from './models';

declare module 'express' {
  interface Request {
    user?: UserModel;
  }
}

import http from 'http';
import https from 'https';
import fs from 'fs';
import app from './app';
import { connectDB } from './config/database.config';
import logger from './utils/logger';

// Now environment variables are available
const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || 'development';
const CERT_PATH = process.env.CERT_PATH || './';

// Connect to database first
const startServer = async () => {
  try {
    // Log important config for debugging
    console.log('📋 Server Configuration:');
    console.log(`  - NODE_ENV: ${ENV}`);
    console.log(`  - PORT: ${PORT}`);
    console.log(`  - DB_HOST: ${process.env.DB_HOST}`);
    console.log(`  - DB_PORT: ${process.env.DB_PORT}`);
    console.log(`  - REDIS_HOST: ${process.env.REDIS_HOST || 'not configured'}`);
    console.log(`  - REDIS_URL: ${process.env.REDIS_URL || 'not configured'}`);
    console.log('');

    await connectDB();
    logger.info('Database connected successfully');

    let server;

    if (ENV === 'production') {
      // HTTPS for production
      try {
        const sslOptions = {
          key: fs.readFileSync(`${CERT_PATH}localhost-key.pem`),
          cert: fs.readFileSync(`${CERT_PATH}localhost.pem`),
        };
        server = https.createServer(sslOptions, app);
        logger.info('SSL certificates loaded successfully');
      } catch (err) {
        logger.error('Error loading SSL certificates:', err);
        process.exit(1);
      }
    } else {
      // HTTP for development
      server = http.createServer(app);
    }

    server.listen(PORT, () => {
      const protocol = ENV === 'production' ? 'https' : 'http';
      console.log(`🚀 Server running on ${protocol}://localhost:${PORT}`);
      console.log(`📝 Health check: ${protocol}://localhost:${PORT}/health`);
      console.log(`🔐 Auth routes: ${protocol}://localhost:${PORT}/api/auth`);
      console.log(`👑 Admin routes: ${protocol}://localhost:${PORT}/api/admin`);
      console.log(`💳 Payment routes: ${protocol}://localhost:${PORT}/api/payments`);
      logger.info(`Server running on ${protocol}://localhost:${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      logger.info('Received shutdown signal, closing server...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();