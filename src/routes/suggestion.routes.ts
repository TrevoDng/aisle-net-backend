// src/routes/suggestion.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import {
  getSuggestions,
  createSuggestion,
  forwardSuggestion,
  updateSuggestionStatus,
} from '../controllers/suggestion.controller';
import { verifyUserToken, requireRole } from '../services/auth.service';

const router = Router();

// All suggestion routes require authentication
router.use(verifyUserToken);

// GET /api/suggestions - Get suggestions (filtered by role)
router.get('/', getSuggestions);

// POST /api/suggestions - Create new suggestion
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
  ],
  createSuggestion
);

// POST /api/suggestions/:id/forward - Forward suggestion to admin (employee only)
router.post(
  '/:id/forward',
  requireRole('EMPLOYEE'),
  [
    body('note').optional().isString(),
  ],
  forwardSuggestion
);

// PATCH /api/suggestions/:id/status - Update suggestion status (admin only)
router.patch(
  '/:id/status',
  requireRole('ADMIN'),
  [
    body('status').isIn(['pending', 'under_review', 'forwarded']).withMessage('Invalid status'),
  ],
  updateSuggestionStatus
);

export default router;