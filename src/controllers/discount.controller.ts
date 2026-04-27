// src/controllers/discount.controller.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import Discount from '../models/Discount';
import Product from '../models/Product';
import AuditLog from '../models/AuditLog';
import logger from '../utils/logger';
import catchAsync from '../utils/catchAsync';

// ==================== PUBLIC CONTROLLERS ====================

// Get active discount for a product (public, no auth)
export const getProductDiscount = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const now = new Date();

  const discount = await Discount.findOne({
    where: {
      productId,
      status: 'approved',
      startDate: { [Op.lte]: now },
      endDate: { [Op.gte]: now },
    },
  });

  res.success(discount, 'Discount retrieved successfully');
});

// Get multiple product discounts (for listing pages)
export const getProductsDiscounts = catchAsync(async (req: Request, res: Response) => {
  const { productIds } = req.body;
  
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return res.success({}, 'No products to check');
  }

  const now = new Date();

  const discounts = await Discount.findAll({
    where: {
      productId: { [Op.in]: productIds },
      status: 'approved',
      startDate: { [Op.lte]: now },
      endDate: { [Op.gte]: now },
    },
  });

  // Map discounts by productId
  const discountMap: { [key: string]: Discount } = {};
  discounts.forEach(discount => {
    discountMap[discount.productId] = discount;
  });

  res.success(discountMap, 'Discounts retrieved successfully');
});

// ==================== EMPLOYEE/CREATOR CONTROLLERS ====================

// Create discount (employees - pending, admin - auto-approved)
export const createDiscount = catchAsync(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Validation failed', 400, 'VALIDATION_ERROR', { errors: errors.array() });
  }

  const { productId, discountAmount, startDate, endDate } = req.body;
  const user = req.user;

  if (!user || !user.id) {
    return res.error('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const createdByName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Unknown';
  const createdByEmail = user.email ?? 'Unknown';

  // Check if product exists
  const product = await Product.findByPk(productId);
  if (!product) {
    return res.error('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Check if there's already an active or pending discount for this product
  const existingDiscount = await Discount.findOne({
    where: {
      productId,
      status: { [Op.in]: ['pending', 'approved'] },
      endDate: { [Op.gte]: new Date() },
    },
  });

  if (existingDiscount) {
    return res.error(
      'This product already has an active or pending discount. Please wait for it to expire or contact admin.',
      409,
      'DISCOUNT_EXISTS'
    );
  }

  // Determine status based on user role
  const status = user?.role === 'ADMIN' ? 'approved' : 'pending';

  const discount = await Discount.create({
    productId,
    discountAmount,
    createdBy: user.id,
    createdByName: createdByName,
    createdByEmail: createdByEmail,
    status,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    ...(status === 'approved' && {
      approvedBy: user?.id,
      approvedAt: new Date(),
    }),
  });

  await AuditLog.create({
    eventType: status === 'approved' ? 'DISCOUNT_CREATED' : 'DISCOUNT_PENDING',
    severity: 'INFO',
    userId: user?.id,
    email: user?.email,
    details: {
      productId,
      productTitle: product.title,
      discountAmount,
      startDate,
      endDate,
      status,
    },
  });

  logger.info(`Discount ${status} by ${user?.email} for product ${product.title}`);

  res.status(201).success(discount, status === 'approved' ? 'Discount created successfully' : 'Discount submitted for approval');
});

// Get my discounts (employee view)
export const getMyDiscounts = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { status, limit = 100, offset = 0 } = req.query;

  const where: any = { createdBy: user?.id };
  if (status) where.status = status;

  const discounts = await Discount.findAndCountAll({
    where,
    include: [{
      model: Product,
      as: 'product',
      attributes: ['id', 'title', 'brand', 'price', 'category'],
    }],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  });

  // Transform the price in the response
const transformedDiscounts = discounts.rows.map(discount => {
  const discountObj = discount.toJSON() as any;
  if (discountObj.product) {
    discountObj.product.price = discountObj.product.price.toString();
  }
  return discountObj;
});

  res.success({
    discounts: transformedDiscounts,
    total: discounts.count,
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  }, 'Discounts retrieved successfully');
});

// Update discount (only pending ones)
export const updateDiscount = catchAsync(async (req: Request, res: Response) => {
  const discountIdParam = req.params.discountId;
    const discountId = Array.isArray(discountIdParam) ? discountIdParam[0] : discountIdParam;
  const { discountAmount, startDate, endDate } = req.body;
  const user = req.user;

  const discount = await Discount.findByPk(discountId);

  if (!discount) {
    return res.error('Discount not found', 404, 'DISCOUNT_NOT_FOUND');
  }

  // Check ownership (only creator can update, unless admin)
  if (discount.createdBy !== user?.id && user?.role !== 'ADMIN') {
    return res.error('You can only update your own discounts', 403, 'ACCESS_DENIED');
  }

  // Only pending discounts can be updated (or admin can update any)
  if (discount.status !== 'pending' && user?.role !== 'ADMIN') {
    return res.error('Only pending discounts can be modified', 400, 'INVALID_STATUS');
  }

  await discount.update({
    discountAmount: discountAmount || discount.discountAmount,
    startDate: startDate ? new Date(startDate) : discount.startDate,
    endDate: endDate ? new Date(endDate) : discount.endDate,
  });

  await AuditLog.create({
    eventType: 'DISCOUNT_UPDATED',
    severity: 'INFO',
    userId: user?.id,
    email: user?.email,
    details: {
      discountId: discount.id,
      productId: discount.productId,
      updates: { discountAmount, startDate, endDate },
    },
  });

  res.success(discount, 'Discount updated successfully');
});

// Delete discount
export const deleteDiscount = catchAsync(async (req: Request, res: Response) => {
  const discountIdParam = req.params.discountId;
  const discountId = Array.isArray(discountIdParam) ? discountIdParam[0] : discountIdParam;
  const user = req.user;

  const discount = await Discount.findByPk(discountId);

  if (!discount) {
    return res.error('Discount not found', 404, 'DISCOUNT_NOT_FOUND');
  }

  // Check ownership
  if (discount.createdBy !== user?.id && user?.role !== 'ADMIN') {
    return res.error('You can only delete your own discounts', 403, 'ACCESS_DENIED');
  }

  await discount.destroy();

  await AuditLog.create({
    eventType: 'DISCOUNT_DELETED',
    severity: 'WARNING',
    userId: user?.id,
    email: user?.email,
    details: {
      discountId: discount.id,
      productId: discount.productId,
      wasApproved: discount.status === 'approved',
    },
  });

  res.success({ message: 'Discount deleted successfully' }, 'Discount deleted');
});

// ==================== ADMIN ONLY CONTROLLERS ====================

// Get pending discounts (for admin approval)
export const getPendingDiscounts = catchAsync(async (req: Request, res: Response) => {
  const { limit = 100, offset = 0 } = req.query;

  const discounts = await Discount.findAndCountAll({
    where: { status: 'pending' },
    include: [{
      model: Product,
      as: 'product',
      attributes: ['id', 'title', 'brand', 'price', 'category'],
    }],
    order: [['createdAt', 'ASC']],
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  });

  res.success({
    discounts: discounts.rows,
    total: discounts.count,
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  }, 'Pending discounts retrieved successfully');
});

// Get all discounts (admin)
export const getAllDiscounts = catchAsync(async (req: Request, res: Response) => {
  const { status, productId, limit = 100, offset = 0 } = req.query;

  const where: any = {};
  if (status) where.status = status;
  if (productId) where.productId = productId;

  const discounts = await Discount.findAndCountAll({
    where,
    include: [{
      model: Product,
      as: 'product',
      attributes: ['id', 'title', 'brand', 'price', 'category'],
    }],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  });

  res.success({
    discounts: discounts.rows,
    total: discounts.count,
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  }, 'Discounts retrieved successfully');
});

// Approve discount (admin)
export const approveDiscount = catchAsync(async (req: Request, res: Response) => {
  const discountIdParam = req.params.discountId;
  const discountId = Array.isArray(discountIdParam) ? discountIdParam[0] : discountIdParam;
  const adminUser = req.user;

  const discount = await Discount.findByPk(discountId);

  if (!discount) {
    return res.error('Discount not found', 404, 'DISCOUNT_NOT_FOUND');
  }

  if (discount.status !== 'pending') {
    return res.error(`Discount status is ${discount.status}, cannot approve`, 400, 'INVALID_STATUS');
  }

  // Check if there's already another approved discount for this product
  const existingApproved = await Discount.findOne({
    where: {
      productId: discount.productId,
      status: 'approved',
      endDate: { [Op.gte]: new Date() },
      id: { [Op.ne]: discount.id },
    },
  });

  if (existingApproved) {
    // Delete the existing approved discount
    await existingApproved.destroy();
    logger.info(`Existing discount for product ${discount.productId} was replaced by admin ${adminUser?.email}`);
  }

  await discount.update({
    status: 'approved',
    approvedBy: adminUser?.id,
    approvedAt: new Date(),
  });

  const product = await Product.findByPk(discount.productId);

  await AuditLog.create({
    eventType: 'DISCOUNT_APPROVED',
    severity: 'INFO',
    userId: adminUser?.id,
    email: adminUser?.email,
    details: {
      discountId: discount.id,
      productId: discount.productId,
      productTitle: product?.title,
      createdBy: discount.createdByEmail,
      discountAmount: discount.discountAmount,
    },
  });

  logger.info(`Discount ${discount.id} approved by admin ${adminUser?.email}`);

  res.success(discount, 'Discount approved successfully');
});

// Reject discount (admin)
export const rejectDiscount = catchAsync(async (req: Request, res: Response) => {
  const discountIdParam = req.params.discountId;
  const discountId = Array.isArray(discountIdParam) ? discountIdParam[0] : discountIdParam;
  const { reason } = req.body;
  const adminUser = req.user;

  const discount = await Discount.findByPk(discountId);

  if (!discount) {
    return res.error('Discount not found', 404, 'DISCOUNT_NOT_FOUND');
  }

  if (discount.status !== 'pending') {
    return res.error(`Discount status is ${discount.status}, cannot reject`, 400, 'INVALID_STATUS');
  }

  await discount.update({
    status: 'rejected',
    rejectionReason: reason || 'No reason provided',
  });

  const product = await Product.findByPk(discount.productId);

  await AuditLog.create({
    eventType: 'DISCOUNT_REJECTED',
    severity: 'WARNING',
    userId: adminUser?.id,
    email: adminUser?.email,
    details: {
      discountId: discount.id,
      productId: discount.productId,
      productTitle: product?.title,
      createdBy: discount.createdByEmail,
      reason: reason || 'No reason provided',
    },
  });

  logger.warn(`Discount ${discount.id} rejected by admin ${adminUser?.email}`, { reason });

  res.success(discount, 'Discount rejected successfully');
});

// Auto-expire discounts (can be called by a cron job)
export const expireOldDiscounts = catchAsync(async (req: Request, res: Response) => {
  const now = new Date();

  const [updatedCount] = await Discount.update(
    { status: 'expired' },
    {
      where: {
        status: 'approved',
        endDate: { [Op.lt]: now },
      },
    }
  );

  logger.info(`Expired ${updatedCount} discounts`);

  res.success({ expiredCount: updatedCount }, 'Expired discounts updated');
});