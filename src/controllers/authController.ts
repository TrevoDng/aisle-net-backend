import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { ApiResponse } from '../types/api';
import AppError from '@/utils/AppError';
import catchAsync from '@/utils/catchAsync';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest extends LoginRequest {
  firstName: string;
  lastName: string;
  phone?: string;
}

const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const createSendToken = (
  user: User, 
  statusCode: number, 
  res: Response
): void => {
  const token = signToken(user.id);
  user.password = undefined as any;
  
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  } as ApiResponse);
};

export const register = catchAsync(
  async (req: Request<{}, {}, RegisterRequest>, res: Response, next: NextFunction) => {
    const { email, password, firstName, lastName, phone } = req.body;
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError('User already exists', 400));
    }
    
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: 'customer'
    });
    
    createSendToken(user, 201, res);
  }
);

export const login = catchAsync(
  async (req: Request<{}, {}, LoginRequest>, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }
    
    await user.update({ lastLogin: new Date() });
    createSendToken(user, 200, res);
  }
);

export const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      status: 'success',
      data: { user: req.user }
    } as ApiResponse);
  }
);
