// src/app.ts
//import './types/express-augmentation';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import logger from './utils/logger';
import { responseMiddleware } from './middleware/response.middleware';
import setupRoutes from './routes/setup.routes';
import path from 'path/win32';
import uploadRoutes from './routes/upload.routes';
import productRoutes from './routes/product.routes';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' }
  }
});

app.use(cors());
app.use(express.json());
app.use(limiter);
app.use(cookieParser());

app.use(responseMiddleware);



// Routes
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', uploadRoutes);
app.use('/api/products', productRoutes);


// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' }
  });
});

export default app;
