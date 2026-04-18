// src/routes/product.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { 
    createProduct,
    getMyProducts,
    getPendingProducts,
    approveProduct,
    rejectProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct, 
    getPublicApprovedProducts,
    getPublicProductById
    } from '../controllers/product.controller';
import { verifyUserToken, requireRole } from '../services/auth.service';

const router = Router();

// ==================== PUBLIC ROUTES (NO AUTH REQUIRED) ====================

// Get approved products for public display (no authentication needed)
// router.get('/public/approved', getPublicApprovedProducts);

// Get single product by ID (public - only if approved)
// router.get('/public/:productId', getPublicProductById);


// ==================== PROTECTED ROUTES ====================

// Create product (Employees and Admins)
router.post(
  '/',
  verifyUserToken,
  [
    body('mainType').notEmpty().withMessage('Main type is required'),
    body('subType').notEmpty().withMessage('Sub type is required'),
    body('brand').notEmpty().withMessage('Brand is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('longDescription').notEmpty().withMessage('Long description is required'),
    body('price').isNumeric().withMessage('Valid price is required'),
    body('imgSrc').isArray().withMessage('Images are required'),
  ],
  createProduct
);

// Get my products (employee sees their own products)
router.get('/my-products', verifyUserToken, getMyProducts);

// Get product by ID
router.get('/:productId', verifyUserToken, getProductById);

// Update product (only owner or admin)
router.put('/:productId', verifyUserToken, updateProduct);

// Delete product (only owner or admin)
router.delete('/:productId', verifyUserToken, deleteProduct);

// ==================== ADMIN ONLY ROUTES ====================

// Get all products (admin)
router.get('/admin/all', verifyUserToken, requireRole('ADMIN'), getAllProducts);

// Get pending products (admin)
router.get('/admin/pending', verifyUserToken, requireRole('ADMIN'), getPendingProducts);

// Approve product (admin)
router.post(
  '/admin/:productId/approve',
  verifyUserToken,
  requireRole('ADMIN'),
  approveProduct
);

// Reject product (admin)
router.post(
  '/admin/:productId/reject',
  verifyUserToken,
  requireRole('ADMIN'),
  [
    body('reason').optional().isString(),
  ],
  rejectProduct
);


export default router;