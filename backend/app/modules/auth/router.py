from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer

from app.core.db import session_scope
from .repository import (
    TenantRepository, 
    UserRepository, 
    UserTenantRepository, 
    RoleRepository,
    InviteRepository,
    AuthTokenRepository,
    AuditLogRepository
)
from .service import (
    SignupService, 
    TenantService, 
    UserService,
    TenantProvisioningService,
    InvitationService
)
from .auth_service import AuthService
from .schemas import (
    SignupRequestDto,
    SignupResponseDto, 
    TenantDto,
    UpdateTenantDto,
    UserTenantDto,
    LoginRequestDto,
    LoginResponseDto,
    CreateInviteDto,
    AcceptInviteDto,
    InviteDto,
    ForgotPasswordRequestDto,
    ForgotPasswordResponseDto,
    ValidateResetTokenResponseDto,
    ResetPasswordRequestDto,
    ResetPasswordResponseDto,
    ChangePasswordRequestDto,
    ChangePasswordResponseDto
)


router = APIRouter()
security = HTTPBearer(auto_error=False)


def get_session():
    with session_scope() as session:
        yield session


def get_repositories(session=Depends(get_session)):
    """Get all repository instances"""
    return {
        'tenant_repo': TenantRepository(session),
        'user_repo': UserRepository(session),
        'user_tenant_repo': UserTenantRepository(session),
        'role_repo': RoleRepository(session),
        'invite_repo': InviteRepository(session),
        'auth_token_repo': AuthTokenRepository(session),
        'audit_repo': AuditLogRepository(session)
    }


def get_signup_service(repos=Depends(get_repositories)) -> SignupService:
    """Get signup service with all dependencies"""
    provisioning_service = TenantProvisioningService(repos['role_repo'])
    return SignupService(
        tenant_repo=repos['tenant_repo'],
        user_repo=repos['user_repo'],
        user_tenant_repo=repos['user_tenant_repo'],
        role_repo=repos['role_repo'],
        audit_repo=repos['audit_repo'],
        auth_token_repo=repos['auth_token_repo'],
        provisioning_service=provisioning_service
    )


def get_tenant_service(repos=Depends(get_repositories)) -> TenantService:
    """Get tenant service"""
    return TenantService(
        tenant_repo=repos['tenant_repo'],
        audit_repo=repos['audit_repo']
    )


def get_user_service(repos=Depends(get_repositories)) -> UserService:
    """Get user service"""
    return UserService(
        user_repo=repos['user_repo'],
        user_tenant_repo=repos['user_tenant_repo'],
        audit_repo=repos['audit_repo']
    )


def get_auth_service(repos=Depends(get_repositories)) -> AuthService:
    """Get auth service"""
    return AuthService(
        auth_token_repo=repos['auth_token_repo'],
        user_repo=repos['user_repo'],
        audit_repo=repos['audit_repo']
    )


def get_invitation_service(repos=Depends(get_repositories)) -> InvitationService:
    """Get invitation service"""
    return InvitationService(
        invite_repo=repos['invite_repo'],
        user_repo=repos['user_repo'],
        user_tenant_repo=repos['user_tenant_repo'],
        tenant_repo=repos['tenant_repo'],
        audit_repo=repos['audit_repo'],
        auth_token_repo=repos['auth_token_repo']
    )


def get_password_service(repos=Depends(get_repositories)):
    """Get password service"""
    try:
        from .password_service import PasswordService
        return PasswordService(
            user_repo=repos['user_repo'],
            audit_repo=repos['audit_repo'],
            user_tenant_repo=repos['user_tenant_repo']
        )
    except Exception as e:
        print(f"Error creating PasswordService: {e}")
        raise


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

# Signup endpoints
@router.post("/signup", response_model=SignupResponseDto, status_code=201)
def signup(
    payload: SignupRequestDto, 
    request: Request,
    service: SignupService = Depends(get_signup_service)
):
    """
    Create new tenant with owner user in single transaction.
    
    This endpoint implements the tenant signup flow:
    1. Creates tenant with company information
    2. Creates owner user with encrypted password
    3. Provisions default RBAC roles for the tenant
    4. Links user to tenant with owner role
    5. Sets up initial tenant settings (currency, locale, etc.)
    6. Creates audit log entry
    """
    try:
        client_ip = get_client_ip(request)
        result = service.signup(payload, client_ip)
        return result
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))
    except Exception as ex:
        # Log the error in production
        print(ex)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/login", response_model=LoginResponseDto)
def login(
    payload: LoginRequestDto,
    request: Request,
    service: AuthService = Depends(get_auth_service)
):
    """
    Authenticate user and return tokens
    
    This endpoint implements the login flow:
    1. Rate limiting check
    2. Find user by email with tenant info
    3. Validate password
    4. Check tenant domain (if feature flag enabled)
    5. Generate access and refresh tokens
    6. Log success/failure attempts
    """
    try:
        client_ip = get_client_ip(request)
        result = service.authenticate(
            email=payload.email,
            password=payload.password,
            tenant_domain=payload.tenant_domain,
            ip_address=client_ip
        )
        
        if not result:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        return LoginResponseDto(**result)
        
    except ValueError as ex:
        # Rate limiting or validation errors
        raise HTTPException(status_code=429, detail=str(ex))
    except Exception as ex:
        # Log the error in production
        print(ex)
        raise HTTPException(status_code=500, detail="Internal server error")


# Tenant management endpoints  
@router.get("/tenants/current", response_model=TenantDto)
def get_current_tenant(
    tenant_id: UUID,  # This should come from JWT token in real implementation
    service: TenantService = Depends(get_tenant_service)
):
    """Get current tenant information"""
    tenant = service.get_current_tenant(tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.patch("/tenants/current", response_model=TenantDto)
def update_current_tenant(
    payload: UpdateTenantDto,
    tenant_id: UUID,  # This should come from JWT token in real implementation  
    user_id: UUID,    # This should come from JWT token in real implementation
    service: TenantService = Depends(get_tenant_service)
):
    """Update current tenant settings"""
    try:
        tenant = service.update_tenant(tenant_id, payload, user_id)
        return tenant
    except ValueError as ex:
        raise HTTPException(status_code=404, detail=str(ex))


# User management endpoints
@router.get("/users/me/tenants", response_model=List[UserTenantDto])
def get_user_tenants(
    user_id: UUID,  # This should come from JWT token in real implementation
    service: UserService = Depends(get_user_service)
):
    """Get all tenants for current user"""
    return service.get_user_tenants(user_id)


@router.get("/users/me/tenant/primary", response_model=UserTenantDto)
def get_primary_tenant(
    user_id: UUID,  # This should come from JWT token in real implementation
    service: UserService = Depends(get_user_service)
):
    """Get primary tenant for current user"""
    tenant = service.get_primary_tenant(user_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="No primary tenant found")
    return tenant


# Invitation endpoints
@router.post("/invitations", response_model=InviteDto, status_code=201)
def create_invitation(
    payload: CreateInviteDto,
    request: Request,
    tenant_id: UUID,  # This should come from JWT token in real implementation
    inviter_user_id: UUID,  # This should come from JWT token in real implementation
    service: InvitationService = Depends(get_invitation_service)
):
    """
    Create and send invitation to a new user.
    
    This endpoint implements the invitation creation flow:
    1. Validates email doesn't already exist as a user
    2. Checks for existing pending invitations
    3. Generates secure token
    4. Creates invitation record
    5. Sends invitation email
    6. Creates audit log
    """
    try:
        client_ip = get_client_ip(request)
        result = service.create_invitation(payload, tenant_id, inviter_user_id, client_ip)
        return result
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))
    except Exception as ex:
        # Log the error in production
        print(f"Failed to create invitation: {ex}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/invitations/{token}", response_model=InviteDto)
def validate_invitation(
    token: str,
    service: InvitationService = Depends(get_invitation_service)
):
    """
    Validate invitation token and return invitation details.
    
    This endpoint checks:
    1. Token exists
    2. Token not expired
    3. Invitation status is pending
    """
    try:
        result = service.validate_invitation(token)
        return result
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))
    except Exception as ex:
        # Log the error in production
        print(f"Failed to validate invitation: {ex}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/invitations/{token}/accept", response_model=LoginResponseDto)
def accept_invitation(
    token: str,
    payload: AcceptInviteDto,
    request: Request,
    service: InvitationService = Depends(get_invitation_service)
):
    """
    Accept invitation and create user account.
    
    This endpoint implements the invitation acceptance flow:
    1. Validates invitation token
    2. Creates user account
    3. Assigns user to tenant with specified roles
    4. Marks invitation as accepted
    5. Generates auth tokens
    6. Creates audit log
    7. Returns login response with tokens
    """
    try:
        client_ip = get_client_ip(request)
        result = service.accept_invitation(token, payload, client_ip)
        return result
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))
    except Exception as ex:
        # Log the error in production
        print(f"Failed to accept invitation: {ex}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Password Reset Endpoints
@router.post("/password/forgot", response_model=ForgotPasswordResponseDto)
def forgot_password(
    payload: ForgotPasswordRequestDto,
    request: Request,
    service = Depends(get_password_service)
):
    """
    Initiate password reset process by sending reset email.
    Always returns success for security (doesn't reveal if email exists).
    
    This endpoint implements the forgot password flow:
    1. Look for user by email
    2. Generate secure token (if user exists)
    3. Store token in Redis with 15min TTL
    4. Send reset email with reset link
    5. Create audit log
    6. Always return success for security
    """
    try:
        client_ip = get_client_ip(request)
        success = service.initiate_password_reset(payload.email, client_ip)
        
        return ForgotPasswordResponseDto(
            message="If your email is registered, you will receive password reset instructions.",
            success=True
        )
        
    except Exception as ex:
        # Log the error in production but still return success for security
        print(f"Error in forgot password: {ex}")
        return ForgotPasswordResponseDto(
            message="If your email is registered, you will receive password reset instructions.",
            success=True
        )


@router.get("/password/reset/{token}", response_model=ValidateResetTokenResponseDto)
def validate_reset_token(
    token: str,
    service = Depends(get_password_service)
):
    """
    Validate reset token and return status.
    
    This endpoint checks:
    1. Token exists in Redis
    2. Token not expired
    3. Associated user still exists
    """
    try:
        result = service.validate_reset_token(token)
        return ValidateResetTokenResponseDto(**result)
        
    except Exception as ex:
        print(f"Error validating reset token: {ex}")
        return ValidateResetTokenResponseDto(
            valid=False,
            message="Token validation failed"
        )


@router.post("/password/reset", response_model=ResetPasswordResponseDto)
def reset_password(
    payload: ResetPasswordRequestDto,
    request: Request,
    service = Depends(get_password_service)
):
    """
    Reset password using valid token.
    
    This endpoint implements the password reset flow:
    1. Validate token and get associated email
    2. Validate new password strength requirements
    3. Update user password with new hash
    4. Revoke the used token
    5. Revoke all user sessions for security
    6. Send confirmation email
    7. Create audit log
    """
    try:
        client_ip = get_client_ip(request)
        result = service.reset_password(payload.token, payload.new_password, client_ip)
        return ResetPasswordResponseDto(**result)
        
    except Exception as ex:
        print(f"Error resetting password: {ex}")
        return ResetPasswordResponseDto(
            success=False,
            message="Password reset failed"
        )


@router.post("/password/change", response_model=ChangePasswordResponseDto)
def change_password(
    payload: ChangePasswordRequestDto,
    request: Request,
    user_id: UUID,  # This should come from JWT token in real implementation
    service = Depends(get_password_service)
):
    """
    Change password for authenticated user.
    
    This endpoint implements the password change flow:
    1. Verify current password
    2. Validate new password strength requirements
    3. Check new password is different from current
    4. Update user password with new hash
    5. Revoke all user sessions for security
    6. Send confirmation email
    7. Create audit log
    """
    try:
        client_ip = get_client_ip(request)
        result = service.change_password(
            user_id=user_id,
            current_password=payload.current_password,
            new_password=payload.new_password,
            ip_address=client_ip
        )
        return ChangePasswordResponseDto(**result)
        
    except Exception as ex:
        print(f"Error changing password: {ex}")
        return ChangePasswordResponseDto(
            success=False,
            message="Password change failed"
        )


# Test email endpoint (development only)
@router.post("/test-email")
def test_email(recipient_email: str = "test@example.com"):
    """Test email configuration by sending a test email"""
    try:
        from .email_service import EmailService
        email_service = EmailService()
        
        success = email_service.send_test_email(recipient_email)
        
        return {
            "status": "success" if success else "failed",
            "message": f"Test email {'sent' if success else 'failed'} to {recipient_email}",
            "recipient": recipient_email
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error testing email: {str(e)}",
            "recipient": recipient_email
        }


# Health check endpoint
@router.get("/health")
def health_check():
    """Health check endpoint for auth service"""
    return {"status": "healthy", "service": "auth"}


# TODO: Add these endpoints in future iterations:
# - POST /auth/refresh (token refresh)  
# - POST /auth/logout (logout)
# - GET /users (list users in tenant)
# - PATCH /users/{id} (update user)
# - GET /roles (list roles)
# - POST /roles (create custom role)
# - GET /audit (audit logs)
# - GET /sessions/me (active sessions)
# - DELETE /sessions/{id} (revoke session)
