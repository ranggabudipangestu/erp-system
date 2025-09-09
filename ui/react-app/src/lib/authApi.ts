import { apiRequest } from './api';
import { SignupRequest, SignupResponse, LoginRequest, LoginResponse, Tenant } from '@/types/auth';

class AuthApi {
  // Signup
  async signup(data: SignupRequest): Promise<SignupResponse> {
    return apiRequest<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Login
  async login(data: LoginRequest): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get current tenant
  async getCurrentTenant(tenantId: string): Promise<Tenant> {
    return apiRequest<Tenant>(`/auth/tenants/current?tenant_id=${tenantId}`);
  }

  // Update tenant
  async updateTenant(tenantId: string, data: Partial<Tenant>): Promise<Tenant> {
    return apiRequest<Tenant>(`/auth/tenants/current?tenant_id=${tenantId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; service: string }> {
    return apiRequest<{ status: string; service: string }>('/auth/health');
  }
}

export const authApi = new AuthApi();