// src/routes/discount.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProductDiscount,
  getProductsDiscounts,
  createDiscount,
  getMyDiscounts,
  updateDiscount,
  deleteDiscount,
  getPendingDiscounts,
  getAllDiscounts,
  approveDiscount,
  rejectDiscount,
} from '../controllers/discount.controller';
import { verifyUserToken, requireRole } from '../services/auth.service';

const router = Router();

// ==================== PUBLIC ROUTES (NO AUTH) ====================
router.get('/public/product/:productId', getProductDiscount);
router.post('/public/products/batch', getProductsDiscounts);

// ==================== PROTECTED ROUTES ====================

// Create discount (employees = pending, admin = auto-approved)
router.post(
  '/',
  verifyUserToken,
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('discountAmount').isInt({ min: 1, max: 100 }).withMessage('Discount must be between 1 and 100 percent'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required')
      .custom((endDate, { req }) => {
        if (new Date(endDate) <= new Date(req.body.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
  ],
  createDiscount
);

// Get my discounts
router.get('/my-discounts', verifyUserToken, getMyDiscounts);

// Update discount
router.put('/:discountId', verifyUserToken, updateDiscount);

// Delete discount
router.delete('/:discountId', verifyUserToken, deleteDiscount);

// ==================== ADMIN ONLY ROUTES ====================

// Get pending discounts
router.get('/admin/pending', verifyUserToken, requireRole('ADMIN'), getPendingDiscounts);

// Get all discounts
router.get('/admin/all', verifyUserToken, requireRole('ADMIN'), getAllDiscounts);

// Approve discount
router.post('/admin/:discountId/approve', verifyUserToken, requireRole('ADMIN'), approveDiscount);

// Reject discount
router.post(
  '/admin/:discountId/reject',
  verifyUserToken,
  requireRole('ADMIN'),
  [body('reason').optional().isString()],
  rejectDiscount
);

export default router;