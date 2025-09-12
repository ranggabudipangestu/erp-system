import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ValidateResetTokenResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse
} from '@/types/auth';
import { AuthService } from '@/lib/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiError {
  detail: string;
}

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
      
      // Handle non-JSON responses (like 204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const error = data as ApiError;
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
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