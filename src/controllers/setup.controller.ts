// src/controllers/setup.controller.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import logger from '../utils/logger';
import catchAsync from '../utils/catchAsync';

export const setupFirstAdmin = catchAsync(async (req: Request, res: Response) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Validation failed', 400, 'VALIDATION_ERROR', { errors: errors.array() });
  }

  const { firstName, lastName, email, password } = req.body;

  // Check if any admin already exists
  const existingAdmin = await User.findOne({ 
    where: { role: 'ADMIN' } 
  });

  if (existingAdmin) {
    return res.error('Admin account already exists. Setup is disabled.', 403, 'SETUP_DISABLED');
  }

  // Check if email already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.error('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Create first admin
  const admin = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    phone: '',
    role: 'ADMIN',
    status: 'active', // First admin is active immediately
  });

  // Log the action
  await AuditLog.create({
    eventType: 'FIRST_ADMIN_CREATED',
    severity: 'INFO',
    userId: admin.id,
    email: admin.email,
    details: {
      adminName: `${firstName} ${lastName}`,
      setupCompleted: true
    },
  });

  logger.info(`First admin account created: ${email}`);

  res.status(201).success({
    id: admin.id,
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    role: admin.role
  }, 'Admin account created successfully. Please login.');
});

// Add this function to setup.controller.ts
export const checkAdminExists = catchAsync(async (req: Request, res: Response) => {
  const admin = await User.findOne({ where: { role: 'ADMIN' } });
  res.success({ hasAdmin: !!admin }, 'Admin status checked');
});