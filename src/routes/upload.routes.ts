// src/routes/upload.routes.ts
import { Router } from 'express';
import {
  uploadProductImage,
  deleteProductImage,
  deleteMultipleProductImages,
  // serveImage  // REMOVE this import
} from '../controllers/upload.controller';
import { verifyUserToken } from '../services/auth.service';

const router = Router();

// REMOVE this line - we don't need it anymore (using static serving instead)
// router.get('/images/:userId/:productType/:productSubType/:filename', serveImage);

// Protected routes - require authentication
router.use(verifyUserToken);

// Upload product image (for employees and admins)
router.post('/upload/product-image', uploadProductImage);

// Delete product image
router.delete('/upload/product-image', deleteProductImage);

// Delete multiple product images
router.delete('/upload/product-images', deleteMultipleProductImages);

export default router;