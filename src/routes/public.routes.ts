// src/routes/public.routes.ts
import { Router } from 'express';
import { 
  getPublicApprovedProducts, 
  getPublicProductById 
} from '../controllers/product.controller';

const router = Router();

// ==================== PUBLIC PRODUCT ROUTES ====================
// These routes are completely open - NO authentication whatsoever

// Get all approved products
router.get('/products/approved', getPublicApprovedProducts);

// Get single approved product by ID
router.get('/products/:productId', getPublicProductById);

// Health check (already in main app, but adding here for completeness)
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;