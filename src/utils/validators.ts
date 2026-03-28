import { z } from 'zod';

export const generateCodeSchema = z.object({
  expiresInHours: z.number().min(1).max(168).default(24), // 1 hour to 7 days
});

export const validateCodeSchema = z.object({
  code: z.string().min(6).max(20),
});

export const createEmployeeSchema = z.object({
  code: z.string().min(6).max(20),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  firebaseUid: z.string(), // Will come from frontend after Firebase registration
});

export const approveEmployeeSchema = z.object({
  userId: z.string().uuid(),
  approve: z.boolean(),
  reason: z.string().optional(),
});