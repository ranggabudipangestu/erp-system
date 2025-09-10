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
    AuthTokenRepository,
    AuditLogRepository
)
from .service import (
    SignupService, 
    TenantService, 
    UserService,
    TenantProvisioningService
)
from .auth_service import AuthService
from .schemas import (
    SignupRequestDto,
    SignupResponseDto, 
    TenantDto,
    UpdateTenantDto,
    UserTenantDto,
    LoginRequestDto,
    LoginResponseDto
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


# Health check endpoint
@router.get("/health")
def health_check():
    """Health check endpoint for signup service"""
    return {"status": "healthy", "service": "auth"}


# TODO: Add these endpoints in future iterations:
# - POST /auth/login (authentication)
# - POST /auth/refresh (token refresh)  
# - POST /auth/logout (logout)
# - POST /auth/password/forgot (password reset request)
# - POST /auth/password/reset (password reset)
# - POST /users/invite (invite user)
# - POST /users/accept-invite (accept invitation)
# - GET /users (list users in tenant)
# - PATCH /users/{id} (update user)
# - GET /roles (list roles)
# - POST /roles (create custom role)
# - GET /audit (audit logs)
# - GET /sessions/me (active sessions)
# - DELETE /sessions/{id} (revoke session)
