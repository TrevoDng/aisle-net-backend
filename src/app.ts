// src/app.ts
//import './types/express-augmentation';
import express from 'express';
import cors from 'cors';
//import dotenv from 'dotenv';
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
import path from 'path';
import uploadRoutes from './routes/upload.routes';
import productRoutes from './routes/product.routes';
import suggestionRoutes from './routes/suggestion.routes';
import enquiryRoutes from './routes/enquiry.routes';
import publicRoutes from './routes/public.routes';
import discountRoutes from './routes/discount.routes';
import paymentRoutes from './routes/payment.routes';
import { OzowController } from './controllers/ozow.controller';
import { YocoController } from './controllers/yoco.controller';
import { PayfastController } from './controllers/payfast.controller';

//dotenv.config();

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

// ⚠️ IMPORTANT: Special webhook body parsers (MUST be before express.json())
// These need raw body for signature verification
app.use('/api/webhooks/yoco', express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf; // Store raw body for Yoco signature verification
  }
}));

app.use('/api/webhooks/payfast', express.urlencoded({ extended: true }));
app.use('/api/webhooks/ozow', express.urlencoded({ extended: true }));

// Controllers
const payfastController = new PayfastController();
const yocoController = new YocoController();
const ozowController = new OzowController();

app.use(cors());
app.use(express.json());
app.use(limiter);
app.use(cookieParser());

app.use(responseMiddleware);


// Routes

// ==================== PUBLIC ROUTES (NO AUTH) ====================
app.use('/api/public', publicRoutes);
app.use('/api/discounts', discountRoutes);
console.log('✅ Public routes registered at /api/public');

// Use process.cwd() to get the current working directory (project root)
const uploadsPath = path.join(__dirname, '..', 'uploads');
console.log(`📁 Serving static files from: ${uploadsPath}`); // Should show: /your-project-root/uploads
app.use('/uploads', (req, res, next) => {
  // Set CORP headers for images
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(uploadsPath));
// Important: In production, we should replace '*' 
// with your actual frontend domain for security:
// res.setHeader('Access-Control-Allow-Origin', 'https://your-frontend-domain.com');
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', uploadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/payments', paymentRoutes);

// Payments Routes
app.post('/api/payfast/initiate', payfastController.initiatePayment);
app.post('/api/webhooks/payfast', payfastController.handleWebhook);

app.post('/api/yoco/create-payment', yocoController.createPaymentIntent);
app.post('/api/webhooks/yoco', yocoController.handleWebhook);

app.post('/api/ozow/initiate', ozowController.initiatePayment);
app.post('/api/webhooks/ozow', ozowController.handleWebhook);
app.get('/api/ozow/return', ozowController.handleReturn);


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
