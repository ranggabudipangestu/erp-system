import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ValidateResetTokenResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ApiResponse
} from '@/types/auth';
import { AuthService } from '@/lib/auth';
import { AuthApiError } from '@/app/lib/authApi';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth header if authenticated
    const tokens = AuthService.getTokens();
    if (tokens) {
      defaultHeaders['Authorization'] = `Bearer ${tokens.access_token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      const data: any = await response.json();
      const isWrapped = data && typeof data === 'object' && 'success' in data && 'result' in data;

      const isUnauthorized = response.status === 401;

      if (!response.ok) {
        if (isWrapped && data.success === false) {
          const errorInfo: any = data.error ?? {};
          if (isUnauthorized || errorInfo?.code === 'UNAUTHORIZED') {
            AuthService.handleUnauthorized();
          }
          throw new AuthApiError(
            errorInfo?.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorInfo?.code || response.status.toString(),
            data?.traceId,
            errorInfo?.errors || [],
            data?.metadata || {},
            response.statusText
          );
        }

        if (isUnauthorized) {
          AuthService.handleUnauthorized();
        }
        throw new AuthApiError(
          data?.detail || data?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data?.code || response.status.toString(),
          data?.traceId,
          data?.errors || [],
          data?.metadata || {},
          response.statusText
        );
      }

      if (isWrapped) {
        if (data.success === false) {
          const errorInfo: any = data.error ?? {};
          if (errorInfo?.code === 'UNAUTHORIZED') {
            AuthService.handleUnauthorized();
          }
          throw new AuthApiError(
            errorInfo?.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorInfo?.code || response.status.toString(),
            data?.traceId,
            errorInfo?.errors || [],
            data?.metadata || {},
            response.statusText
          );
        }

        return (data as ApiResponse<T>).result;
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'GET',
    });
  }
}

const apiClient = new ApiClient(`${BASE_URL}/auth`);

export const passwordApi = {
  /**
   * Send forgot password request
   * Always returns success for security (doesn't reveal if email exists)
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    return apiClient.post<ForgotPasswordResponse>('/password/forgot', request);
  },

  /**
   * Validate password reset token
   * Returns token validity and associated email if valid
   */
  async validateResetToken(token: string): Promise<ValidateResetTokenResponse> {
    return apiClient.get<ValidateResetTokenResponse>(`/password/reset/${token}`);
  },

  /**
   * Reset password using valid token
   * Updates password and revokes all user sessions
   */
  async resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    return apiClient.post<ResetPasswordResponse>('/password/reset', request);
  },

  /**
   * Change password for authenticated user
   * Requires current password verification
   */
  async changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    return apiClient.post<ChangePasswordResponse>('/password/change', request);
  }
};

export default passwordApi;

// Utility functions for password validation
export const passwordValidation = {
  /**
   * Check password strength requirements
   */
  validatePassword(password: string) {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>/?]/.test(password)
    };
  },

  /**
   * Check if password meets all requirements
   */
  isPasswordStrong(password: string): boolean {
    const validation = this.validatePassword(password);
    return Object.values(validation).every(Boolean);
  },

  /**
   * Get password strength score (0-5)
   */
  getPasswordStrength(password: string): number {
    const validation = this.validatePassword(password);
    return Object.values(validation).reduce((score, isValid) => score + (isValid ? 1 : 0), 0);
  },

  /**
   * Get human-readable password requirements
   */
  getPasswordRequirements(): string[] {
    return [
      'At least 8 characters long',
      'At least one uppercase letter (A-Z)',
      'At least one lowercase letter (a-z)', 
      'At least one number (0-9)',
      'At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)'
    ];
  },

  /**
   * Get missing requirements for a password
   */
  getMissingRequirements(password: string): string[] {
    const validation = this.validatePassword(password);
    const requirements = this.getPasswordRequirements();
    const missing: string[] = [];

    if (!validation.length) missing.push(requirements[0]);
    if (!validation.uppercase) missing.push(requirements[1]);
    if (!validation.lowercase) missing.push(requirements[2]);
    if (!validation.number) missing.push(requirements[3]);
    if (!validation.special) missing.push(requirements[4]);

    return missing;
  }
};
