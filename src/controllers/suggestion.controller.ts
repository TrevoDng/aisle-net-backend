// src/controllers/suggestion.controller.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import Suggestion from '../models/Suggestion';
import AuditLog from '../models/AuditLog';
import logger from '../utils/logger';
import catchAsync from '../utils/catchAsync';

// ==================== GET SUGGESTIONS (FILTERED BY ROLE) ====================
export const getSuggestions = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  
  if (!user) {
    return res.error('User not authenticated', 401, 'UNAUTHORIZED');
  }
  
  let whereClause: any = {};
  
  // Different filtering based on user role
  if (user.role === 'ADMIN') {
    // Admins see all suggestions
    whereClause = {};
  } else if (user.role === 'EMPLOYEE') {
    // Employees see:
    // 1. All suggestions from CLIENTS
    // 2. Their own suggestions (where they are the creator)
    whereClause = {
      [Op.or]: [
        { createdByRole: 'CLIENT' },
        { createdById: user.id }
      ]
    };
  } else if (user.role === 'CLIENT') {
    // Clients see only their own suggestions
    whereClause = {
      createdById: user.id
    };
  }
  
  const suggestions = await Suggestion.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
  });
  
  res.success({ suggestions }, 'Suggestions retrieved successfully');
});

// ==================== CREATE SUGGESTION ====================
export const createSuggestion = catchAsync(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Validation failed', 400, 'VALIDATION_ERROR', { errors: errors.array() });
  }
  
  const user = req.user;
  if (!user) {
    return res.error('User not authenticated', 401, 'UNAUTHORIZED');
  }
  
  const { title, content } = req.body;
  
  const suggestion = await Suggestion.create({
    title,
    content,
    status: 'pending',
    createdById: user.id,
    createdByName: `${user.firstName} ${user.lastName}`,
    createdByEmail: user.email,
    createdByRole: user.role,
  });
  
  await AuditLog.create({
    eventType: 'SUGGESTION_CREATED',
    severity: 'INFO',
    userId: user.id,
    email: user.email,
    details: {
      suggestionId: suggestion.id,
      title: suggestion.title,
      role: user.role
    },
  });
  
  logger.info(`Suggestion created by ${user.email}: ${suggestion.title}`);
  
  res.success({ suggestion }, 'Suggestion created successfully');
});

// ==================== FORWARD SUGGESTION TO ADMIN ====================
export const forwardSuggestion = catchAsync(async (req: Request, res: Response) => {
  const idParam = req.params.id; 
  const id = Array.isArray(idParam) ? idParam[0] : idParam; // Handle case where id might be an array
  const { note } = req.body;
  const user = req.user;
  
  if (!user) {
    return res.error('User not authenticated', 401, 'UNAUTHORIZED');
  }
  
  const suggestion = await Suggestion.findByPk(id);
  
  if (!suggestion) {
    return res.error('Suggestion not found', 404, 'SUGGESTION_NOT_FOUND');
  }
  
  // Only employees can forward suggestions
  if (user.role !== 'EMPLOYEE') {
    return res.error('Only employees can forward suggestions', 403, 'ACCESS_DENIED');
  }
  
  // Can only forward if not already forwarded
  if (suggestion.status === 'forwarded') {
    return res.error('Suggestion has already been forwarded', 400, 'ALREADY_FORWARDED');
  }
  
  await suggestion.update({
    status: 'forwarded',
    forwardedAt: new Date(),
    forwardedBy: `${user.firstName} ${user.lastName} (${user.role})`,
    forwardedNote: note || null,
  });
  
  await AuditLog.create({
    eventType: 'SUGGESTION_FORWARDED',
    severity: 'INFO',
    userId: user.id,
    email: user.email,
    details: {
      suggestionId: suggestion.id,
      title: suggestion.title,
    },
  });
  
  logger.info(`Suggestion ${suggestion.id} forwarded by ${user.email}`);
  
  res.success({ suggestion }, 'Suggestion forwarded to administration successfully');
});

// ==================== UPDATE SUGGESTION STATUS (ADMIN ONLY) ====================
export const updateSuggestionStatus = catchAsync(async (req: Request, res: Response) => {
  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam; // Handle case where id might be an array
  const { status } = req.body;
  const user = req.user;
  
  if (!user) {
    return res.error('User not authenticated', 401, 'UNAUTHORIZED');
  }
  
  // Only admins can update suggestion status
  if (user.role !== 'ADMIN') {
    return res.error('Only admins can update suggestion status', 403, 'ACCESS_DENIED');
  }
  
  const suggestion = await Suggestion.findByPk(id);
  
  if (!suggestion) {
    return res.error('Suggestion not found', 404, 'SUGGESTION_NOT_FOUND');
  }
  
  await suggestion.update({ status });
  
  res.success({ suggestion }, 'Suggestion status updated successfully');
});