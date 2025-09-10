from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# Signup Schemas
class SignupOwnerDto(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class SignupRequestDto(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    industry: Optional[str] = Field(None, max_length=100)
    domain: Optional[str] = Field(None, max_length=100, pattern=r'^[a-z0-9-]+$')
    owner: SignupOwnerDto
    locale: Optional[str] = Field(default="en", max_length=10)
    currency: Optional[str] = Field(default="USD", max_length=3)
    timezone: Optional[str] = Field(default="UTC", max_length=50)


class SignupResponseDto(BaseModel):
    tenant_id: UUID
    message: str = "Tenant created successfully"
    next_steps: List[str] = [
        "Complete company profile setup",
        "Invite team members",
        "Configure business settings"
    ]
    # Authentication tokens
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


# Tenant Schemas
class TenantSettingsDto(BaseModel):
    currency: Optional[str] = None
    locale: Optional[str] = None
    timezone: Optional[str] = None
    tax_profile: Optional[Dict[str, Any]] = None


class TenantDto(BaseModel):
    id: UUID
    name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    settings: Optional[TenantSettingsDto] = None
    plan: str
    region: str
    deployment_mode: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class UpdateTenantDto(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    industry: Optional[str] = Field(None, max_length=100)
    settings: Optional[TenantSettingsDto] = None


# User Schemas
class UserDto(BaseModel):
    id: UUID
    email: str
    name: str
    status: str
    is_verified: bool
    mfa_enabled: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class CreateUserDto(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=1, max_length=200)


class UpdateUserDto(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    status: Optional[str] = Field(None, pattern="^(active|inactive|pending)$")


# UserTenant Schemas
class UserTenantDto(BaseModel):
    id: UUID
    user_id: UUID
    tenant_id: UUID
    roles: List[str]
    is_primary_tenant: bool
    joined_at: datetime
    updated_at: Optional[datetime] = None
    tenant: Optional[TenantDto] = None


class AssignRolesDto(BaseModel):
    user_id: UUID
    roles: List[str] = Field(..., min_items=1)


# Role Schemas
class RoleDto(BaseModel):
    id: UUID
    tenant_id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    permissions: List[str]
    is_system_role: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class CreateRoleDto(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    permissions: List[str] = Field(..., min_items=1)


class UpdateRoleDto(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    permissions: Optional[List[str]] = Field(None, min_items=1)


# Invite Schemas
class CreateInviteDto(BaseModel):
    email: EmailStr
    roles: List[str] = Field(..., min_items=1)


class AcceptInviteDto(BaseModel):
    token: str
    name: str = Field(..., min_length=1, max_length=200)
    password: str = Field(..., min_length=8, max_length=128)


class InviteDto(BaseModel):
    id: UUID
    tenant_id: UUID
    email: str
    roles: List[str]
    status: str
    expires_at: datetime
    created_at: datetime
    accepted_at: Optional[datetime] = None


# Auth Schemas
class LoginRequestDto(BaseModel):
    email: EmailStr
    password: str
    tenant_domain: Optional[str] = None  # For multi-tenant login


class UserLoginDto(BaseModel):
    id: str
    email: str
    name: str
    status: str
    is_verified: bool
    mfa_enabled: bool


class TenantLoginDto(BaseModel):
    id: str
    name: Optional[str] = None
    domain: Optional[str] = None
    roles: List[str]


class LoginResponseDto(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserLoginDto
    tenant: TenantLoginDto


class RefreshTokenRequestDto(BaseModel):
    refresh_token: str


class RefreshTokenResponseDto(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class LogoutRequestDto(BaseModel):
    refresh_token: str


# Password Reset Schemas
class ForgotPasswordRequestDto(BaseModel):
    email: EmailStr


class ResetPasswordRequestDto(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


# MFA Schemas
class SetupMFAResponseDto(BaseModel):
    otpauth_url: str
    qr_code: str  # Base64 encoded QR code image


class VerifyMFARequestDto(BaseModel):
    code: str = Field(..., min_length=6, max_length=6, pattern=r'^\d{6}$')


# Session Management Schemas
class SessionDto(BaseModel):
    id: UUID
    device_info: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    is_current: bool = False


# Audit Log Schemas
class AuditLogDto(BaseModel):
    id: UUID
    tenant_id: UUID
    user_id: Optional[UUID] = None
    action: str
    resource: Optional[str] = None
    resource_id: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime


class AuditLogFilterDto(BaseModel):
    action: Optional[str] = None
    resource: Optional[str] = None
    user_id: Optional[UUID] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    limit: int = Field(default=100, le=1000)