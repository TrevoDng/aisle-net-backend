
export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: 'CLIENT' | 'EMPLOYEE' | 'ADMIN';
  status: 'pending_email' | 'email_verified' | 'pending_approval' | 'active' | 'rejected' | 'deactivated';
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface CreateUserData {
  firebaseUid: string;
  email: string;
  name: string;
  role?: 'CLIENT' | 'EMPLOYEE' | 'ADMIN';
  status?: 'pending_email' | 'email_verified' | 'pending_approval' | 'active';
  secretCode?: string;
  createdBy?: string;
}

export interface SecretCode {
  id: string;
  code: string;
  isUsed: boolean;
  expiresAt: Date;
  createdBy: string;
  usedBy?: string;
  usedAt?: Date;
}

export interface AuditLog {
  eventType: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  userId?: string;
  firebaseUid?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}

/*
export interface ApiResponse<T = any> {
  status: 'success' | 'fail' | 'error';
  data?: T;
  message?: string;
  token?: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserPayload {
  id: string;
  email: string;
  role: 'admin' | 'employee' | 'customer';
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  sku?: string;
  images?: string[];
}

export interface OrderInput {
  userId: string;
  items: OrderItemInput[];
  shippingAddress: Address;
  paymentMethod: string;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
  price: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface User {
    id: number;
    uid: string;
    name: string;
    email: string;
    role: 'admin' | 'employee' | 'customer';
    registration_status: 'pending_code_validation' | 'pending_email_verification' | 'pending_admin_approval' | 'active' | 'suspended' | 'rejected';
    email_verified: boolean;
    admin_approved: boolean;
    created_at: Date;
}

export interface EmployeeInvite {
    id: number;
    email: string;
    secret_code: string;
    role: string;
    created_by: number;
    expires_at: Date;
    used: boolean;
    use_count: number;
    max_uses: number;
}

*/