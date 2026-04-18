// src/controllers/enquiry.controller.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import Enquiry from '../models/Enquiry';
import AuditLog from '../models/AuditLog';
import logger from '../utils/logger';
import catchAsync from '../utils/catchAsync';

// ==================== GET ENQUIRIES (FILTERED BY ROLE) ====================
export const getEnquiries = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  
  if (!user) {
    return res.error('User not authenticated', 401, 'UNAUTHORIZED');
  }
  
  let whereClause: any = {};
  
  // Different filtering based on user role
  if (user.role === 'ADMIN') {
    // Admins see all enquiries
    whereClause = {};
  } else if (user.role === 'EMPLOYEE') {
    // Employees see:
    // 1. All enquiries from CLIENTS
    // 2. Their own enquiries (where they are the creator)
    whereClause = {
      [Op.or]: [
        { createdByRole: 'CLIENT' },
        { createdById: user.id }
      ]
    };
  } else if (user.role === 'CLIENT') {
    // Clients see only their own enquiries
    whereClause = {
      createdById: user.id
    };
  }
  
  const enquiries = await Enquiry.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
  });
  
  res.success({ enquiries }, 'Enquiries retrieved successfully');
});

// ==================== CREATE ENQUIRY ====================
export const createEnquiry = catchAsync(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Validation failed', 400, 'VALIDATION_ERROR', { errors: errors.array() });
  }
  
  const user = req.user;
  if (!user) {
    return res.error('User not authenticated', 401, 'UNAUTHORIZED');
  }
  
  const { subject, message } = req.body;
  
  const enquiry = await Enquiry.create({
    subject,
    message,
    status: 'pending',
    createdById: user.id,
    createdByName: `${user.firstName} ${user.lastName}`,
    createdByEmail: user.email,
    createdByRole: user.role,
  });
  
  await AuditLog.create({
    eventType: 'ENQUIRY_CREATED',
    severity: 'INFO',
    userId: user.id,
    email: user.email,
    details: {
      enquiryId: enquiry.id,
      subject: enquiry.subject,
      role: user.role
    },
  });
  
  logger.info(`Enquiry created by ${user.email}: ${enquiry.subject}`);
  
  res.success({ enquiry }, 'Enquiry created successfully');
});

// ==================== RESOLVE ENQUIRY ====================
export const resolveEnquiry = catchAsync(async (req: Request, res: Response) => {
  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const { note } = req.body;
  const user = req.user;
  
  if (!user) {
    return res.error('User not authenticated', 401, 'UNAUTHORIZED');
  }
  
  const enquiry = await Enquiry.findByPk(id);
  
  if (!enquiry) {
    return res.error('Enquiry not found', 404, 'ENQUIRY_NOT_FOUND');
  }
  
  // Check if user has permission to resolve
  if (user.role !== 'ADMIN' && enquiry.createdById !== user.id) {
    return res.error('You can only resolve your own enquiries', 403, 'ACCESS_DENIED');
  }
  
  if (enquiry.status === 'resolved') {
    return res.error('Enquiry is already resolved', 400, 'ALREADY_RESOLVED');
  }
  
  await enquiry.update({
    status: 'resolved',
    resolvedAt: new Date(),
    resolvedBy: `${user.firstName} ${user.lastName} (${user.role})`,
    resolutionNote: note || null,
  });
  
  await AuditLog.create({
    eventType: 'ENQUIRY_RESOLVED',
    severity: 'INFO',
    userId: user.id,
    email: user.email,
    details: {
      enquiryId: enquiry.id,
      subject: enquiry.subject,
      resolvedBy: user.role
    },
  });
  
  logger.info(`Enquiry ${enquiry.id} resolved by ${user.email}`);
  
  res.success({ enquiry }, 'Enquiry resolved successfully');
});

// ==================== UPDATE ENQUIRY STATUS ====================
export const updateEnquiryStatus = catchAsync(async (req: Request, res: Response) => {
  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const { status } = req.body;
  const user = req.user;
  
  if (!user) {
    return res.error('User not authenticated', 401, 'UNAUTHORIZED');
  }
  
  // Only admins can update status to in_progress
  if (user.role !== 'ADMIN') {
    return res.error('Only admins can update enquiry status', 403, 'ACCESS_DENIED');
  }
  
  const enquiry = await Enquiry.findByPk(id);
  
  if (!enquiry) {
    return res.error('Enquiry not found', 404, 'ENQUIRY_NOT_FOUND');
  }
  
  await enquiry.update({ status });
  
  res.success({ enquiry }, 'Enquiry status updated successfully');
});