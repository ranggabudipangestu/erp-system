import { SignupRequest, SignupResponse, LoginRequest, LoginResponse, CreateInviteRequest, Invite, AcceptInviteRequest, UserTenant, TenantUser } from '@/types/auth';
import { AuthService } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class AuthApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
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

  private async fetchWithError(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // If JSON parsing fails, use statusText
      }
      
      throw new AuthApiError(
        errorMessage,
        response.status,
        response.statusText
      );
    }

    return response;
  }

  async signup(data: SignupRequest): Promise<SignupResponse> {
    const response = await this.fetchWithError('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.fetchWithError('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const response = await this.fetchWithError('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    return response.json();
  }

  async logout(refreshToken: string): Promise<void> {
    await this.fetchWithError('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async forgotPassword(email: string): Promise<void> {
    await this.fetchWithError('/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.fetchWithError('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }

  // Invitation methods
  async createInvitation(data: CreateInviteRequest, tenantId: string, inviterUserId: string): Promise<Invite> {
    const response = await this.fetchWithError(`/auth/invitations?tenant_id=${tenantId}&inviter_user_id=${inviterUserId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async getUserTenants(): Promise<UserTenant[]> {
    const response = await this.fetchWithError('/auth/users/me/tenants', {
      method: 'GET',
    });

    return response.json();
  }

  async getTenantUsers(): Promise<TenantUser[]> {
    const response = await this.fetchWithError('/auth/tenants/current/users', {
      method: 'GET',
    });

    return response.json();
  }

  async validateInvitation(token: string): Promise<Invite> {
    const response = await this.fetchWithError(`/auth/invitations/${token}`, {
      method: 'GET',
    });

    return response.json();
  }

  async acceptInvitation(token: string, data: AcceptInviteRequest): Promise<LoginResponse> {
    const response = await this.fetchWithError(`/auth/invitations/${token}/accept`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.json();
  }
}

export const authApi = new AuthApi();
export { AuthApiError };
