export interface SignupOwner {
  name: string;
  email: string;
  password: string;
}

export interface SignupRequest {
  company_name: string;
  industry?: string;
  domain?: string;
  owner: SignupOwner;
  locale?: string;
  currency?: string;
  timezone?: string;
}

export interface SignupResponse {
  tenant_id: string;
  message: string;
  next_steps: string[];
}

export interface TenantSettings {
  currency?: string;
  locale?: string;
  timezone?: string;
  tax_profile?: Record<string, any>;
}

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  settings?: TenantSettings;
  plan: string;
  region: string;
  deployment_mode: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  status: string;
  is_verified: boolean;
  mfa_enabled: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserTenant {
  id: string;
  user_id: string;
  tenant_id: string;
  roles: string[];
  is_primary_tenant: boolean;
  joined_at: string;
  updated_at?: string;
  tenant?: Tenant;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenant_domain?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
  tenant: Tenant;
}