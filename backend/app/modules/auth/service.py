import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, List
from uuid import UUID, uuid4

from passlib.context import CryptContext

from .repository import (
    TenantRepository, 
    UserRepository, 
    UserTenantRepository, 
    RoleRepository,
    InviteRepository,
    AuthTokenRepository,
    AuditLogRepository
)
from .models import Tenant, User, UserTenant, Role, Invite, AuthToken, AuditLog
from .schemas import (
    SignupRequestDto, 
    SignupResponseDto, 
    TenantDto, 
    UserDto, 
    UserTenantDto,
    CreateUserDto,
    UpdateTenantDto,
    TenantSettingsDto
)


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def generate_secure_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


# Mapping functions
def map_tenant_to_dto(entity: Tenant) -> TenantDto:
    settings = None
    if entity.settings:
        settings = TenantSettingsDto(**entity.settings)
    
    return TenantDto(
        id=entity.id,
        name=entity.name,
        domain=entity.domain,
        industry=entity.industry,
        settings=settings,
        plan=entity.plan,
        region=entity.region,
        deployment_mode=entity.deployment_mode,
        is_active=entity.is_active,
        created_at=entity.created_at,
        updated_at=entity.updated_at,
    )


def map_user_to_dto(entity: User) -> UserDto:
    return UserDto(
        id=entity.id,
        email=entity.email,
        name=entity.name,
        status=entity.status,
        is_verified=entity.is_verified,
        mfa_enabled=entity.mfa_enabled,
        created_at=entity.created_at,
        updated_at=entity.updated_at,
    )


def map_user_tenant_to_dto(entity: UserTenant) -> UserTenantDto:
    tenant_dto = None
    if entity.tenant:
        tenant_dto = map_tenant_to_dto(entity.tenant)
    
    return UserTenantDto(
        id=entity.id,
        user_id=entity.user_id,
        tenant_id=entity.tenant_id,
        roles=entity.roles,
        is_primary_tenant=entity.is_primary_tenant,
        joined_at=entity.joined_at,
        updated_at=entity.updated_at,
        tenant=tenant_dto,
    )


class TenantProvisioningService:
    """Service responsible for tenant provisioning and setup"""
    
    def __init__(self, role_repo: RoleRepository):
        self.role_repo = role_repo

    def create_default_roles(self, tenant_id: UUID) -> List[Role]:
        """Create default roles for a new tenant based on RBAC matrix"""
        default_roles = [
            {
                "name": "owner",
                "description": "Tenant owner with full access",
                "permissions": [
                    "tenant.manage_settings", "users.invite_user", "users.deactivate_user",
                    "roles.create_role", "finance.view_reports", "finance.post_journal",
                    "sales.create_order", "sales.sync_marketplace", "inventory.stock_in_out",
                    "inventory.transfer_stock", "manufacturing.create_bom", "manufacturing.create_wo"
                ]
            },
            {
                "name": "admin", 
                "description": "Tenant administrator",
                "permissions": [
                    "tenant.manage_settings", "users.invite_user", "users.deactivate_user",
                    "roles.create_role", "finance.view_reports", "sales.sync_marketplace"
                ]
            },
            {
                "name": "finance",
                "description": "Finance team role",
                "permissions": ["finance.view_reports", "finance.post_journal"]
            },
            {
                "name": "sales",
                "description": "Sales team role", 
                "permissions": ["sales.create_order"]
            },
            {
                "name": "warehouse",
                "description": "Warehouse team role",
                "permissions": ["inventory.stock_in_out", "inventory.transfer_stock"]
            },
            {
                "name": "production",
                "description": "Production team role",
                "permissions": ["manufacturing.create_bom", "manufacturing.create_wo"]
            }
        ]

        roles = []
        for role_data in default_roles:
            role = Role(
                id=uuid4(),
                tenant_id=tenant_id,
                name=role_data["name"],
                description=role_data["description"],
                permissions=role_data["permissions"],
                is_system_role=False,
                created_at=datetime.utcnow()
            )
            roles.append(role)

        return self.role_repo.create_many(roles)

    def setup_tenant_settings(self, tenant: Tenant, locale: str, currency: str, timezone: str) -> Tenant:
        """Setup initial tenant settings"""
        settings = {
            "locale": locale,
            "currency": currency,
            "timezone": timezone,
            "tax_profile": {}
        }
        tenant.settings = settings
        return tenant


class SignupService:
    def __init__(
        self, 
        tenant_repo: TenantRepository,
        user_repo: UserRepository, 
        user_tenant_repo: UserTenantRepository,
        role_repo: RoleRepository,
        audit_repo: AuditLogRepository,
        provisioning_service: TenantProvisioningService
    ):
        self.tenant_repo = tenant_repo
        self.user_repo = user_repo
        self.user_tenant_repo = user_tenant_repo
        self.role_repo = role_repo
        self.audit_repo = audit_repo
        self.provisioning_service = provisioning_service

    def signup(self, payload: SignupRequestDto, ip_address: str = None) -> SignupResponseDto:
        """
        Complete tenant signup process:
        1. Validate input and check for conflicts
        2. Create tenant 
        3. Create owner user
        4. Link user to tenant with owner role
        5. Provision default roles
        6. Setup tenant settings
        7. Create audit log
        """
        
        # Validate email not already exists
        if self.user_repo.email_exists(payload.owner.email):
            raise ValueError(f"User with email '{payload.owner.email}' already exists")
        
        # Validate domain not already taken (if provided)
        if payload.domain and self.tenant_repo.domain_exists(payload.domain):
            raise ValueError(f"Domain '{payload.domain}' is already taken")

        # Create tenant
        tenant_id = uuid4()
        tenant = Tenant(
            id=tenant_id,
            name=payload.company_name,
            domain=payload.domain,
            industry=payload.industry,
            plan="basic",  # Default plan
            region="ap-southeast-1",  # Default region
            deployment_mode="shared",  # Start with shared mode
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        # Setup tenant settings
        tenant = self.provisioning_service.setup_tenant_settings(
            tenant, payload.locale, payload.currency, payload.timezone
        )
        
        # Create tenant
        created_tenant = self.tenant_repo.create(tenant)

        # Create owner user
        user_id = uuid4()
        user = User(
            id=user_id,
            email=payload.owner.email,
            password_hash=hash_password(payload.owner.password),
            name=payload.owner.name,
            status="active",
            is_verified=False,  # Email verification can be implemented later
            mfa_enabled=False,
            created_at=datetime.utcnow()
        )
        created_user = self.user_repo.create(user)

        # Provision default roles for tenant
        self.provisioning_service.create_default_roles(tenant_id)

        # Create user-tenant relationship with owner role
        user_tenant = UserTenant(
            id=uuid4(),
            user_id=user_id,
            tenant_id=tenant_id,
            roles=["owner"],  # Owner role
            is_primary_tenant=True,  # First tenant is primary
            joined_at=datetime.utcnow()
        )
        self.user_tenant_repo.create(user_tenant)

        # Create audit log
        audit_log = AuditLog(
            id=uuid4(),
            tenant_id=tenant_id,
            user_id=user_id,
            action="signup",
            resource="tenant",
            resource_id=str(tenant_id),
            payload={
                "company_name": payload.company_name,
                "industry": payload.industry,
                "domain": payload.domain,
                "owner_email": payload.owner.email
            },
            ip_address=ip_address,
            created_at=datetime.utcnow()
        )
        self.audit_repo.create(audit_log)

        return SignupResponseDto(
            tenant_id=tenant_id,
            message="Tenant created successfully",
            next_steps=[
                "Complete company profile setup",
                "Invite team members", 
                "Configure business settings",
                "Connect to marketplace platforms"
            ]
        )


class TenantService:
    def __init__(self, tenant_repo: TenantRepository, audit_repo: AuditLogRepository):
        self.tenant_repo = tenant_repo
        self.audit_repo = audit_repo

    def get_current_tenant(self, tenant_id: UUID) -> Optional[TenantDto]:
        tenant = self.tenant_repo.get_by_id(tenant_id)
        return map_tenant_to_dto(tenant) if tenant else None

    def update_tenant(self, tenant_id: UUID, payload: UpdateTenantDto, user_id: UUID) -> Optional[TenantDto]:
        tenant = self.tenant_repo.get_by_id(tenant_id)
        if not tenant:
            raise ValueError(f"Tenant with ID '{tenant_id}' not found")

        # Update fields
        if payload.name is not None:
            tenant.name = payload.name
        if payload.industry is not None:
            tenant.industry = payload.industry
        if payload.settings is not None:
            # Merge with existing settings
            current_settings = tenant.settings or {}
            new_settings = payload.settings.dict(exclude_unset=True)
            tenant.settings = {**current_settings, **new_settings}

        tenant.updated_at = datetime.utcnow()
        
        updated_tenant = self.tenant_repo.update(tenant)

        # Create audit log
        audit_log = AuditLog(
            id=uuid4(),
            tenant_id=tenant_id,
            user_id=user_id,
            action="tenant.update",
            resource="tenant",
            resource_id=str(tenant_id),
            payload=payload.dict(exclude_unset=True),
            created_at=datetime.utcnow()
        )
        self.audit_repo.create(audit_log)

        return map_tenant_to_dto(updated_tenant)


class UserService:
    def __init__(
        self, 
        user_repo: UserRepository, 
        user_tenant_repo: UserTenantRepository,
        audit_repo: AuditLogRepository
    ):
        self.user_repo = user_repo
        self.user_tenant_repo = user_tenant_repo
        self.audit_repo = audit_repo

    def get_user_tenants(self, user_id: UUID) -> List[UserTenantDto]:
        user_tenants = self.user_tenant_repo.get_by_user(user_id)
        return [map_user_tenant_to_dto(ut) for ut in user_tenants]

    def get_primary_tenant(self, user_id: UUID) -> Optional[UserTenantDto]:
        user_tenant = self.user_tenant_repo.get_primary_tenant(user_id)
        return map_user_tenant_to_dto(user_tenant) if user_tenant else None

    def create_user(self, payload: CreateUserDto, tenant_id: UUID, roles: List[str] = None) -> UserDto:
        if self.user_repo.email_exists(payload.email):
            raise ValueError(f"User with email '{payload.email}' already exists")

        user_id = uuid4()
        user = User(
            id=user_id,
            email=payload.email,
            password_hash=hash_password(payload.password),
            name=payload.name,
            status="active",
            is_verified=False,
            mfa_enabled=False,
            created_at=datetime.utcnow()
        )
        created_user = self.user_repo.create(user)

        # Create user-tenant relationship
        user_tenant = UserTenant(
            id=uuid4(),
            user_id=user_id,
            tenant_id=tenant_id,
            roles=roles or [],
            is_primary_tenant=False,
            joined_at=datetime.utcnow()
        )
        self.user_tenant_repo.create(user_tenant)

        return map_user_to_dto(created_user)