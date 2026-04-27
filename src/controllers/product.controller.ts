// src/controllers/product.controller.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import Product from '../models/Product';
import AuditLog from '../models/AuditLog';
import logger from '../utils/logger';
import catchAsync from '../utils/catchAsync';

// ==================== EMPLOYEE/CREATOR CONTROLLERS ====================

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Validation failed', 400, 'VALIDATION_ERROR', { errors: errors.array() });
  }

  const user = req.user;
  const productData = req.body;

  const product = await Product.create({
    ...productData,
    employeeId: user?.id,
    employeeName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
    employeeEmail: user?.email,
    status: 'pending',
  });

  await AuditLog.create({
    eventType: 'PRODUCT_CREATED',
    severity: 'INFO',
    userId: user?.id,
    email: user?.email,
    details: {
      productId: product.id,
      productTitle: product.title,
      status: 'pending'
    },
  });

  logger.info(`Product created by ${user?.email}: ${product.title}`);

  res.status(201).success({
    id: product.id,
    title: product.title,
    status: product.status
  }, 'Product submitted for approval');
});

export const getMyProducts = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { status, limit = 50, offset = 0 } = req.query;

  const where: any = { employeeId: user?.id };
  if (status) where.status = status;

  const products = await Product.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  });

  res.success({
    products: products.rows,
    total: products.count,
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  }, 'Products retrieved successfully');
});

export const getProductById = catchAsync(async (req: Request, res: Response) => {
    const ProductIdParam = req.params.productId;
    const productId = Array.isArray(ProductIdParam) ? ProductIdParam[0] : ProductIdParam;
    const user = req.user;

  const product = await Product.findByPk(productId);

  if (!product) {
    return res.error('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Check access: admin can view all, others can only view their own or approved products
  if (user?.role !== 'ADMIN' && product.employeeId !== user?.id && product.status !== 'approved') {
    return res.error('Access denied', 403, 'ACCESS_DENIED');
  }

  res.success({ product }, 'Product retrieved successfully');
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
    const ProductIdParam = req.params.productId;
    const productId = Array.isArray(ProductIdParam) ? ProductIdParam[0] : ProductIdParam;
    const user = req.user;
    const updates = req.body;

  const product = await Product.findByPk(productId);

  if (!product) {
    return res.error('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Only creator or admin can update
  if (product.employeeId !== user?.id && user?.role !== 'ADMIN') {
    return res.error('Access denied', 403, 'ACCESS_DENIED');
  }

  // Can't update approved products unless admin
  if (product.status === 'approved' && user?.role !== 'ADMIN') {
    return res.error('Approved products cannot be modified. Contact admin.', 403, 'PRODUCT_APPROVED');
  }

  await product.update(updates);

  await AuditLog.create({
    eventType: 'PRODUCT_UPDATED',
    severity: 'INFO',
    userId: user?.id,
    email: user?.email,
    details: {
      productId: product.id,
      productTitle: product.title,
      updates: Object.keys(updates)
    },
  });

  res.success({ product }, 'Product updated successfully');
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const ProductIdParam = req.params.productId;
  const productId = Array.isArray(ProductIdParam) ? ProductIdParam[0] : ProductIdParam;
  const user = req.user;

  const product = await Product.findByPk(productId);

  if (!product) {
    return res.error('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Only creator or admin can delete
  if (product.employeeId !== user?.id && user?.role !== 'ADMIN') {
    return res.error('Access denied', 403, 'ACCESS_DENIED');
  }

  await product.destroy();

  await AuditLog.create({
    eventType: 'PRODUCT_DELETED',
    severity: 'WARNING',
    userId: user?.id,
    email: user?.email,
    details: {
      productId: product.id,
      productTitle: product.title
    },
  });

  res.success({ message: 'Product deleted successfully' }, 'Product deleted');
});

// ==================== ADMIN CONTROLLERS ====================

export const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const { status, employeeId, limit = 100, offset = 0 } = req.query;

  const where: any = {};
  if (status) where.status = status;
  if (employeeId) where.employeeId = employeeId;

  const products = await Product.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  });

  res.success({
    products: products.rows,
    total: products.count,
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  }, 'Products retrieved successfully');
});

export const getPendingProducts = catchAsync(async (req: Request, res: Response) => {
  const products = await Product.findAll({
    where: { status: 'pending' },
    order: [['createdAt', 'ASC']],
  });

  res.success(products, 'Pending products retrieved successfully');
});

export const approveProduct = catchAsync(async (req: Request, res: Response) => {
  const ProductIdParam = req.params.productId;
  const productId = Array.isArray(ProductIdParam) ? ProductIdParam[0] : ProductIdParam;
  const adminUser = req.user;

  const product = await Product.findByPk(productId);

  if (!product) {
    return res.error('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  if (product.status !== 'pending') {
    return res.error(`Product status is ${product.status}, cannot approve`, 400, 'INVALID_STATUS');
  }

  await product.update({
    status: 'approved',
    approvedBy: adminUser?.id,
    approvedAt: new Date(),
  });

  await AuditLog.create({
    eventType: 'PRODUCT_APPROVED',
    severity: 'INFO',
    userId: adminUser?.id,
    email: adminUser?.email,
    details: {
      productId: product.id,
      productTitle: product.title,
      employeeId: product.employeeId,
      employeeEmail: product.employeeEmail
    },
  });

  logger.info(`Product ${product.title} approved by admin ${adminUser?.email}`);

  res.success({ product }, 'Product approved successfully');
});

export const rejectProduct = catchAsync(async (req: Request, res: Response) => {
  const ProductIdParam = req.params.productId;
  const productId = Array.isArray(ProductIdParam) ? ProductIdParam[0] : ProductIdParam;
  const { reason } = req.body;
  const adminUser = req.user;

  const product = await Product.findByPk(productId);

  if (!product) {
    return res.error('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  if (product.status !== 'pending') {
    return res.error(`Product status is ${product.status}, cannot reject`, 400, 'INVALID_STATUS');
  }

  await product.update({
    status: 'rejected',
    rejectionReason: reason || 'No reason provided',
  });

  await AuditLog.create({
    eventType: 'PRODUCT_REJECTED',
    severity: 'WARNING',
    userId: adminUser?.id,
    email: adminUser?.email,
    details: {
      productId: product.id,
      productTitle: product.title,
      reason: reason || 'No reason provided',
      employeeId: product.employeeId,
      employeeEmail: product.employeeEmail
    },
  });

  logger.warn(`Product ${product.title} rejected by admin ${adminUser?.email}`, { reason });

  res.success({ product }, 'Product rejected successfully');
});

// ==================== PUBLIC CONTROLLERS (NO AUTH) ====================

export const getPublicApprovedProducts = catchAsync(async (req: Request, res: Response) => {
  const { limit = 100, offset = 0 } = req.query;

  const products = await Product.findAndCountAll({
    where: { status: 'approved' },
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  });

    // Transform price to string
  const transformedProducts = products.rows.map(product => ({
    id: product.id,
    category: product.category,
    brand: product.brand,
    title: product.title,
    description: product.description,
    longDescription: product.longDescription,
    price: product.price.toString(),
    stockQuantity: product.stockQuantity,
    imgSrc: product.imgSrc,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  }));

  res.success({
    products: transformedProducts,
    total: products.count,
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  }, 'Approved products retrieved successfully');
});

export const getPublicProductById = catchAsync(async (req: Request, res: Response) => {
  const ProductIdParam = req.params.productId;
  const productId = Array.isArray(ProductIdParam) ? ProductIdParam[0] : ProductIdParam;

  const product = await Product.findByPk(productId);

  if (!product) {
    return res.error('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Only return if product is approved
  if (product.status !== 'approved') {
    return res.error('Product not available', 404, 'PRODUCT_NOT_AVAILABLE');
  }

  // Transform price to string
  const transformedProduct = {
    id: product.id,
    category: product.category,
    brand: product.brand,
    title: product.title,
    description: product.description,
    longDescription: product.longDescription,
    price: product.price.toString(),
    stockQuantity: product.stockQuantity,
    imgSrc: product.imgSrc,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };

  res.success({ product: transformedProduct }, 'Product retrieved successfully');
});