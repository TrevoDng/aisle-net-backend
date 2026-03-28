import { Request, Response, NextFunction } from 'express';
import { FirebaseService } from '../services/firebaseService';
import User from '../models/User';
import logger from '../utils/logger';
import '../types/express'; // Import the type definitions

const firebaseService = new FirebaseService();

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'NO_TOKEN', message: 'No token provided' } 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Firebase
    const firebaseUser = await firebaseService.verifyIdToken(token);
    
    // Get user from database using Sequelize
    const dbUser = await User.findOne({
      where: { firebaseUid: firebaseUser.uid }
    });
    
    if (!dbUser) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'USER_NOT_FOUND', message: 'User not found in database' } 
      });
    }
    
    // Check if user is active
    if (dbUser.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'ACCOUNT_NOT_ACTIVE', message: `Account status: ${dbUser.status}` } 
      });
    }
    
    // Attach user to request - now guaranteed to exist
    req.user = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified,
      dbUser,
    };
    
    next();
  } catch (error) {
    logger.error('Token verification failed', { error });
    return res.status(401).json({ 
      success: false, 
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } 
    });
  }
};