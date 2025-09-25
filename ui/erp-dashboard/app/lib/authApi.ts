import {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  CreateInviteRequest,
  Invite,
  AcceptInviteRequest,
  UserTenant,
  TenantUser,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  ChangePasswordResponse,
  ApiResponse,
} from '@/types/auth';
import { AuthService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class AuthApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public traceId?: string,
    public errors: any[] = [],
    public metadata: Record<string, any> = {},
    public statusText?: string
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

class AuthApi {
  private getAuthHeaders(): Record<string, string> {
    try {
      const tokens = AuthService.getTokens();
      if (tokens?.access_token) {
        return {
          Authorization: `Bearer ${tokens.access_token}`,
        };
      }
    } catch (error) {
      console.warn('Unable to read auth tokens for request:', error);
    }

    return {};
  }

  private async fetchWithError<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers,
      ...options,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const isWrappedResponse = data && typeof data === 'object' && 'success' in data && 'result' in data;

    if (!response.ok) {
      const isUnauthorized = response.status === 401;

      if (isWrappedResponse && data.success === false) {
        const errorInfo: any = data.error ?? {};
        if (isUnauthorized || errorInfo?.code === 'UNAUTHORIZED') {
          AuthService.handleUnauthorized();
        }
        throw new AuthApiError(
          errorInfo?.message || response.statusText || 'Request failed',
          response.status,
          errorInfo?.code || response.status.toString(),
          data.traceId,
          errorInfo?.errors || [],
          data.metadata || {},
          response.statusText
        );
      }

      const legacyMessage = data?.detail || data?.message || response.statusText || 'Request failed';
      if (isUnauthorized) {
        AuthService.handleUnauthorized();
      }
      throw new AuthApiError(
        legacyMessage,
        response.status,
        data?.code || response.status.toString(),
        data?.traceId,
        data?.errors || [],
        data?.metadata || {},
        response.statusText
      );
    }

    if (isWrappedResponse) {
      const envelope = data as ApiResponse<T>;
      if (envelope.success === false) {
        const errorInfo: any = envelope.error ?? {};
        if (errorInfo?.code === 'UNAUTHORIZED') {
          AuthService.handleUnauthorized();
        }
        throw new AuthApiError(
          errorInfo?.message || 'Request failed',
          response.status,
          errorInfo?.code || response.status.toString(),
          envelope.traceId,
          errorInfo?.errors || [],
          envelope.metadata || {},
          response.statusText
        );
      }
      return envelope;
    }

    if (!data) {
      return {
        success: true,
        traceId: '',
        error: {},
        metadata: {},
        result: undefined as unknown as T,
      };
    }

    return {
      success: true,
      traceId: '',
      error: {},
      metadata: {},
      result: data as T,
    };
  }

  async signup(data: SignupRequest): Promise<SignupResponse> {
    const response = await this.fetchWithError<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.result;
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.fetchWithError<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.result;
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const response = await this.fetchWithError<{ access_token: string; refresh_token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    return response.result;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.fetchWithError<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await this.fetchWithError<ForgotPasswordResponse>('/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return response.result;
  }

  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    const response = await this.fetchWithError<ResetPasswordResponse>('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    return response.result;
  }

  // Invitation methods
  async createInvitation(data: CreateInviteRequest, tenantId: string, inviterUserId: string): Promise<Invite> {
    const response = await this.fetchWithError<Invite>(
      `/auth/invitations?tenant_id=${tenantId}&inviter_user_id=${inviterUserId}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    return response.result;
  }

  async getUserTenants(): Promise<UserTenant[]> {
    const response = await this.fetchWithError<UserTenant[]>('/auth/users/me/tenants', {
      method: 'GET',
    });

    return response.result;
  }

  async getTenantUsers(): Promise<TenantUser[]> {
    const response = await this.fetchWithError<TenantUser[]>('/auth/tenants/current/users', {
      method: 'GET',
    });

    return response.result;
  }

  async validateInvitation(token: string): Promise<Invite> {
    const response = await this.fetchWithError<Invite>(`/auth/invitations/${token}`, {
      method: 'GET',
    });

    return response.result;
  }

  async acceptInvitation(token: string, data: AcceptInviteRequest): Promise<LoginResponse> {
    const response = await this.fetchWithError<LoginResponse>(`/auth/invitations/${token}/accept`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.result;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
    const response = await this.fetchWithError<ChangePasswordResponse>('/auth/password/change', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });

    return response.result;
  }
}

export const authApi = new AuthApi();
export { AuthApiError };
