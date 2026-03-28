import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import admin from '../services/firebaseService';
import User  from '../models/User';
import SecretCode from '../models/SecretCode';
import AuditLog from '../models/AuditLog';
import { sendVerificationEmail, sendApprovalEmail } from '../services/emailService';
import logger from '../utils/logger';

const router = Router();

// Register endpoint
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('userType').isIn(['customer', 'employee']).withMessage('Invalid user type'),
    body('secretCode').optional(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, userType, secretCode } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    let firebaseUser: any = null;
    const transaction = await User.sequelize!.transaction();
    
    try {
      // LAYER 1: Validate secret code (if employee)
      if (userType === 'employee') {
        if (!secretCode) {
          return res.status(400).json({ 
            message: 'Secret code is required for employee registration' 
          });
        }

        const inviteCode = await SecretCode.findOne({
          where: {
            code: secretCode,
            expiresAt: { [Op.gt]: new Date() },
            isUsed: false,
          },
          transaction
        });

        if (!inviteCode) {
          // Log failed attempt
          await AuditLog.create({
            eventType: 'REGISTRATION_FAILED',
            severity: 'WARNING',
            email,
            details: { secretCode, reason: 'Invalid or expired secret code' },
            ipAddress,
          }, { transaction });
          
          await transaction.rollback();
          return res.status(403).json({ 
            message: 'Invalid or expired registration code. Contact your administrator.' 
          });
        }
        
        // Mark code as used
        await inviteCode.update({
          isUsed: true,
          usedAt: new Date(),
        }, { transaction });
      }
      
      // LAYER 2: Create Firebase Auth user
      firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: false
      });
      
      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date();
      tokenExpires.setHours(tokenExpires.getHours() + 24);
      
      // LAYER 3: Save to PostgreSQL with pending status
      const user = await User.create({
        firebaseUid: firebaseUser.uid,
        name,
        email,
        role: userType === 'employee' ? 'EMPLOYEE' : 'CLIENT',
        status: userType === 'employee' ? 'pending_email' : 'pending_approval',
        emailVerified: false,
        adminApproved: false,
        verificationToken,
        verificationTokenExpires: tokenExpires,
        secretCode: secretCode || null,
      }, { transaction });
      
      // Log successful registration attempt
      await AuditLog.create({
        eventType: 'USER_REGISTERED',
        severity: 'INFO',
        userId: user.id,
        email,
        details: { userType, secretCode: secretCode || null },
        ipAddress,
        userAgent,
      }, { transaction });
      
      await transaction.commit();
      
      // LAYER 4: Send verification email
      await sendVerificationEmail(email, verificationToken, userType);
      
      // Return success with next steps
      res.json({
        message: userType === 'employee' 
          ? 'Registration successful! Please check your email to verify your account. After verification, an administrator will review and approve your registration.'
          : 'Registration successful! Please check your email to verify your account.',
        requiresEmailVerification: true,
        requiresAdminApproval: userType === 'employee'
      });
      
    } catch (error: any) {
      await transaction.rollback();
      
      // Rollback: Delete Firebase user if PostgreSQL fails
      if (firebaseUser) {
        try {
          await admin.auth().deleteUser(firebaseUser.uid);
        } catch (deleteError) {
          logger.error('Failed to delete Firebase user during rollback', deleteError);
        }
      }
      
      // Log error
      logger.error('Registration failed', { error: error.message, email, userType });
      
      res.status(500).json({ 
        message: 'Registration failed. Please try again.' 
      });
    }
  }
);

// Email verification endpoint
router.get('/verify-email', async (req: Request, res: Response) => {
  const { token } = req.query;
  
  try {
    // Find user with token
    const user = await User.findOne({
      where: {
        verificationToken: token,
        verificationTokenExpires: { [Op.gt]: new Date() },
        emailVerified: false,
      }
    });
    
    if (!user) {
      return res.redirect('/verify-failed?reason=invalid-token');
    }
    
    // Update user status based on role
    let newStatus: string;
    let message: string;
    
    if (user.role === 'EMPLOYEE') {
      newStatus = 'pending_approval';
      message = 'Email verified! Your registration is now pending admin approval. You will be notified once approved.';
    } else {
      newStatus = 'active';
      message = 'Email verified! Your account is now active. You can now log in.';
    }
    
    // Update user
    await user.update({
      emailVerified: true,
      status: newStatus,
      verificationToken: null,
      verificationTokenExpires: null,
    });
    
    // Update Firebase email verification
    await admin.auth().updateUser(user.firebaseUid, {
      emailVerified: true
    });
    
    // Log verification
    await AuditLog.create({
      eventType: 'EMAIL_VERIFIED',
      severity: 'INFO',
      userId: user.id,
      email: user.email,
      details: { role: user.role },
    });
    
    // Redirect with success message
    res.redirect(`/login?verified=true&message=${encodeURIComponent(message)}`);
    
  } catch (error) {
    logger.error('Email verification failed', { error });
    res.redirect('/verify-failed?reason=error');
  }
});

export default router;