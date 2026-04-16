// src/controllers/upload.controller.ts
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import catchAsync from '../utils/catchAsync';

// Ensure upload directories exist
const ensureDirectoryExists = async (dirPath: string) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Get folder path based on userId, productType, productSubType
const getImageFolderPath = (userId: string, productType: string, productSubType: string): string => {
  // Sanitize folder names
  const safeUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '_');
  const safeProductType = productType.toLowerCase().replace(/[^a-zA-Z0-9-_]/g, '_');
  const safeProductSubType = productSubType.toLowerCase().replace(/[^a-zA-Z0-9-_]/g, '_');
  
  return path.join('uploads', safeUserId, safeProductType, safeProductSubType);
};

/*
// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    //const { userId, productType, productSubType } = req.params;
    const userIdParam = req.params.userId || req.body.userId;
    const productTypeParam = req.params.productType || req.body.productType;
    const productSubTypeParam = req.params.productSubType || req.body.productSubType;
    
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const productType = Array.isArray(productTypeParam) ? productTypeParam[0] : productTypeParam;
    const productSubType = Array.isArray(productSubTypeParam) ? productSubTypeParam[0] : productSubTypeParam;

    if (!userId || !productType || !productSubType) {
      return cb(new Error('Missing required fields: userId, productType, productSubType'), '');
    }
    
    const folderPath = getImageFolderPath(userId, productType, productSubType);
    const fullPath = path.join(process.cwd(), folderPath);
    
    await ensureDirectoryExists(fullPath);
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomStr = uuidv4().substring(0, 8);
    const index = req.body.index || '0';
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9]/g, '_');
    
    const fileName = `${timestamp}_${randomStr}_${index}_${baseName.substring(0, 30)}${extension}`;
    cb(null, fileName);
  }
});
*/

// Configure multer storage - TEMP FOLDER FIRST
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const tempPath = path.join(process.cwd(), 'uploads', 'temp');
    await ensureDirectoryExists(tempPath);
    cb(null, tempPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomStr = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${timestamp}_${randomStr}${extension}`);
  }
});

// File filter for images only
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Get image URL for client
const getImageUrl = (filePath: string): string => {
  // Convert absolute path to URL path
  const relativePath = filePath.split('uploads')[1];
  return `/uploads${relativePath}`;
};

// ==================== CONTROLLER METHODS ====================

// Upload single product image
export const uploadProductImage = [
  upload.single('image'),
  catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.error('No image file provided', 400, 'NO_FILE');
    }

    const { userId, productType, productSubType, index } = req.body;
    
    if (!userId || !productType || !productSubType) {
      // Clean up temp file
      await fs.unlink(req.file.path).catch(() => {});
      return res.error('Missing required fields: userId, productType, productSubType', 400, 'MISSING_FIELDS');
    }
    
    // Create destination folder
    const folderPath = getImageFolderPath(userId, productType, productSubType);
    const fullPath = path.join(process.cwd(), folderPath);
    await ensureDirectoryExists(fullPath);
    
    // Generate final filename
    const timestamp = Date.now();
    const randomStr = uuidv4().substring(0, 8);
    const extension = path.extname(req.file.originalname);
    const baseName = path.basename(req.file.originalname, extension).replace(/[^a-zA-Z0-9]/g, '_');
    const finalFileName = `${timestamp}_${randomStr}_${index}_${baseName.substring(0, 30)}${extension}`;
    const finalPath = path.join(fullPath, finalFileName);
    
    // Move file from temp to final destination
    await fs.rename(req.file.path, finalPath);
    
    const imageUrl = `/uploads/${userId}/${productType}/${productSubType}/${finalFileName}`;
    
    res.success({
      url: imageUrl,
      fileName: finalFileName,
      originalName: req.file.originalname,
      size: req.file.size
    }, 'Image uploaded successfully');
  })
];

/*
export const uploadProductImage = [
  upload.single('image'),
  catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.error('No image file provided', 400, 'NO_FILE');
    }

    const { userId, productType, productSubType } = req.body;
    
    const imageUrl = getImageUrl(req.file.path);
    
    res.success({
      url: imageUrl,
      fileName: req.file.filename,
      filePath: req.file.path,
      originalName: req.file.originalname,
      size: req.file.size,
      userId,
      productType,
      productSubType
    }, 'Image uploaded successfully');
  })
];
*/

// Delete product image
export const deleteProductImage = catchAsync(async (req: Request, res: Response) => {
  const { imageUrl } = req.body;
  
  if (!imageUrl) {
    return res.error('Image URL is required', 400, 'MISSING_URL');
  }
  
  // Convert URL to file path
  // URL format: /api/images/{userId}/{productType}/{productSubType}/{filename}
  const relativePath = imageUrl.replace('/api/images', '');
  const filePath = path.join(process.cwd(), 'uploads', relativePath);
  
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    
    res.success({ message: 'Image deleted successfully' }, 'Image deleted');
  } catch (error) {
    res.success({ message: 'Image not found or already deleted' }, 'Image not found');
  }
});

// Delete multiple product images
export const deleteMultipleProductImages = catchAsync(async (req: Request, res: Response) => {
  const { imageUrls } = req.body;
  
  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return res.error('Image URLs array is required', 400, 'MISSING_URLS');
  }
  
  const results = await Promise.allSettled(
    imageUrls.map(async (imageUrl: string) => {
      const relativePath = imageUrl.replace('/api/images', '');
      const filePath = path.join(process.cwd(), 'uploads', relativePath);
      
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        return { success: true, url: imageUrl };
      } catch {
        return { success: false, url: imageUrl, error: 'File not found' };
      }
    })
  );
  
  const deleted = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - deleted;
  
  res.success({
    deleted,
    failed,
    total: imageUrls.length
  }, `${deleted} images deleted successfully`);
});

/*
// Serve image files - UPDATED to handle :path(*) parameter
export const serveImage = catchAsync(async (req: Request, res: Response) => {
  const { userId, productType, productSubType, filename } = req.params;
  
  if (!userId || !productType || !productSubType || !filename) {
    return res.status(404).json({ success: false, error: { message: 'Invalid image path' } });
  }
  
  // Security: Prevent directory traversal attacks
  const safeUserId = (Array.isArray(userId) ? userId[0] : userId).replace(/\.\./g, '');
  const safeProductType = (Array.isArray(productType) ? productType[0] : productType).replace(/\.\./g, '');
  const safeProductSubType = (Array.isArray(productSubType) ? productSubType[0] : productSubType).replace(/\.\./g, '');
  const safeFilename = (Array.isArray(filename) ? filename[0] : filename).replace(/\.\./g, '');
  
  const fullPath = path.join(process.cwd(), 'uploads', safeUserId, safeProductType, safeProductSubType, safeFilename);
  
  try {
    await fs.access(fullPath);
    res.sendFile(fullPath);
  } catch (error) {
    res.status(404).json({ success: false, error: { message: 'Image not found' } });
  }
});
*/