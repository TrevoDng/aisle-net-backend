import { Request, Response, NextFunction } from 'express';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.dbUser) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } 
      });
    }
    
    const userRole = req.user.dbUser.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } 
      });
    }
    
    next();
  };
};

export const requireAdmin = requireRole('ADMIN');
export const requireAdminOrEmployee = requireRole('ADMIN', 'EMPLOYEE');

/*
import { Request, Response, NextFunction } from 'express';

export const requireRole = (allowedRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user; // Set by verifyFirebaseToken middleware
            
            if (!user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            
            // Check if user has required role
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }
            
            next();
        } catch (error) {
            res.status(403).json({ message: 'Access denied' });
        }
    };
};
*/