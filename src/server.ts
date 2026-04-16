// src/server.ts
//import './types/express-augmentation';
import { User as UserModel } from './models';

declare module 'express' {
  interface Request {
    user?: UserModel;
  }
}

//import './types/express-augmentation';
import http from 'http';
import https from 'https';
import fs from 'fs';
import app from './app';
import { connectDB } from './config/database.config';
import logger from './utils/logger';

const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || 'development';
const CERT_PATH = process.env.CERT_PATH || './';

// Connect to database first
const startServer = async () => {
  try {
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