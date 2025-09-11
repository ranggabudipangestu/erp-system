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
    InviteDto
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
# - POST /auth/password/forgot (password reset request)
# - POST /auth/password/reset (password reset)
# - GET /users (list users in tenant)
# - PATCH /users/{id} (update user)
# - GET /roles (list roles)
# - POST /roles (create custom role)
# - GET /audit (audit logs)
# - GET /sessions/me (active sessions)
# - DELETE /sessions/{id} (revoke session)
