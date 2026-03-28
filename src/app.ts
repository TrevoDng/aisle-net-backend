import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
// app.ts - remove .js extensions
import adminRoutes from './routes/adminRoutes';
import logger from './utils/logger';
import { connectDB } from './config/database';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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

// Routes
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` }
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`📝 Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export default app;