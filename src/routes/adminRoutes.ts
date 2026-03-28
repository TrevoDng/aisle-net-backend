import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { verifyToken } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleMiddleware';

const router = Router();
const adminController = new AdminController();

// All admin routes require token verification and admin role
router.use(verifyToken);
router.use(requireAdmin);

router.post('/generate-code', adminController.generateSecretCode);
router.get('/pending-employees', adminController.getPendingEmployees);
router.post('/approve-employee', adminController.approveEmployee);
router.get('/users', adminController.getAllUsers);

export default router;


/*
import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/roleMiddleware';
import {
    getActiveInvites,
    deleteInvite,
    extendInvite,
    createEmployeeInvite,
    getPendingApprovals,
    approveEmployee,
    rejectEmployee
} from '../controllers/adminController';

const router = Router();

// All admin routes require authentication and admin role
router.use(verifyFirebaseToken);
router.use(requireRole(['admin']));

// Invite management
router.get('/active-invites', getActiveInvites);
router.post('/create-employee-invite', createEmployeeInvite);
router.delete('/delete-invite/:id', deleteInvite);
router.post('/extend-invite/:id', extendInvite);

// Employee approval management
router.get('/pending-approvals', getPendingApprovals);
router.post('/approve-employee', approveEmployee);
router.post('/reject-employee', rejectEmployee);

export default router;
*/