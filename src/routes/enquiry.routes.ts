// src/routes/enquiry.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import {
  getEnquiries,
  createEnquiry,
  resolveEnquiry,
  updateEnquiryStatus,
} from '../controllers/enquiry.controller';
import { verifyUserToken, requireRole } from '../services/auth.service';

const router = Router();

// All enquiry routes require authentication
router.use(verifyUserToken);

// GET /api/enquiries - Get enquiries (filtered by role)
router.get('/', getEnquiries);

// POST /api/enquiries - Create new enquiry
router.post(
  '/',
  [
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  createEnquiry
);

// POST /api/enquiries/:id/resolve - Resolve an enquiry
router.post(
  '/:id/resolve',
  [
    body('note').optional().isString(),
  ],
  resolveEnquiry
);

// PATCH /api/enquiries/:id/status - Update enquiry status (admin only)
router.patch(
  '/:id/status',
  requireRole('ADMIN'),
  [
    body('status').isIn(['pending', 'in_progress', 'resolved']).withMessage('Invalid status'),
  ],
  updateEnquiryStatus
);

export default router;