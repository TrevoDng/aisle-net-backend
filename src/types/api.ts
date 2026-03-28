export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'fail';
  token?: string;
  data?: T;
  message?: string;
  error?: any;
}

export interface AuthResponse extends ApiResponse {
  token: string;
  data: {
    user: any;
  };
}