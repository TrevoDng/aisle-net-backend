// src/routes/setup.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { checkAdminExists, setupFirstAdmin } from '../controllers/setup.controller';
const router = Router();

// One-time setup to create the first admin (only works when no admin exists)
router.post(
  '/first-admin',
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  ],
  setupFirstAdmin
);

router.get('/check-admin', checkAdminExists);

export default router;