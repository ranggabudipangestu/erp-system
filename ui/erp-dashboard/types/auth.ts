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
  // Authentication tokens
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number; // seconds
}

export interface TenantSettings {
  currency?: string;
  locale?: string;
  timezone?: string;
  tax_profile?: Record<string, any>;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  errors: any[];
}

export interface ApiResponse<T> {
  success: boolean;
  traceId: string;
  error: ApiErrorPayload | Record<string, never>;
  metadata: Record<string, any>;
  result: T;
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

export interface TenantUser {
  membership_id: string;
  user_id: string;
  email: string;
  name: string;
  status: string;
  roles: string[];
  is_primary: boolean;
  joined_at?: string;
  last_active_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenant_domain?: string;
}

export interface UserLogin {
  id: string;
  email: string;
  name: string;
  status: string;
  is_verified: boolean;
  mfa_enabled: boolean;
}

export interface TenantLogin {
  id: string;
  name?: string;
  domain?: string;
  roles: string[];
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserLogin;
  tenant: TenantLogin;
}

// Invitation types
export interface CreateInviteRequest {
  email: string;
  roles: string[];
}

export interface AcceptInviteRequest {
  token: string;
  name: string;
  password: string;
}

export interface Invite {
  id: string;
  tenant_id: string;
  email: string;
  roles: string[];
  status: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
}

export interface InviteValidationResponse {
  invite: Invite;
  tenant?: {
    name: string;
    domain?: string;
  };
}

// Password Reset types
export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
}

export interface ValidateResetTokenResponse {
  valid: boolean;
  email?: string;
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface PasswordValidation {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}
