import hashlib
import secrets
import os
from datetime import datetime, timedelta, timezone
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
from .auth_service import AuthService
from .models import Tenant, User, UserTenant, Role, Invite, AuthToken, AuditLog
from .schemas import (
    SignupRequestDto, 
    SignupResponseDto, 
    TenantDto, 
    UserDto, 
    UserTenantDto,
    CreateUserDto,
    UpdateTenantDto,
    TenantSettingsDto,
    CreateInviteDto,
    AcceptInviteDto,
    InviteDto,
    LoginResponseDto,
    UserLoginDto,
    TenantLoginDto
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


def map_invite_to_dto(entity: Invite) -> InviteDto:
    return InviteDto(
        id=entity.id,
        tenant_id=entity.tenant_id,
        email=entity.email,
        roles=entity.roles,
        status=entity.status,
        expires_at=entity.expires_at,
        created_at=entity.created_at,
        accepted_at=entity.accepted_at,
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
                    "inventory.transfer_stock", "manufacturing.create_bom", "manufacturing.create_wo",
                    # Product permissions
                    "products.read", "products.create", "products.update", "products.delete"
                ]
            },
            {
                "name": "admin", 
                "description": "Tenant administrator",
                "permissions": [
                    "tenant.manage_settings", "users.invite_user", "users.deactivate_user",
                    "roles.create_role", "finance.view_reports", "sales.sync_marketplace",
                    # Product permissions (admin)
                    "products.read", "products.create", "products.update", "products.delete"
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
                created_at=datetime.now(timezone.utc)
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
        auth_token_repo: AuthTokenRepository,
        provisioning_service: TenantProvisioningService
    ):
        self.tenant_repo = tenant_repo
        self.user_repo = user_repo
        self.user_tenant_repo = user_tenant_repo
        self.role_repo = role_repo
        self.audit_repo = audit_repo
        self.auth_token_repo = auth_token_repo
        self.provisioning_service = provisioning_service
        # Use TokenService directly for token generation during signup
        from .token_service import TokenService
        self.token_service = TokenService(auth_token_repo)

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
            created_at=datetime.now(timezone.utc)
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
            created_at=datetime.now(timezone.utc)
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
            joined_at=datetime.now(timezone.utc)
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
            created_at=datetime.now(timezone.utc)
        )
        self.audit_repo.create(audit_log)

        # Generate authentication tokens
        access_token = self.token_service.generate_access_token(created_user, tenant_id)
        refresh_token = self.token_service.generate_refresh_token(created_user, tenant_id, ip_address)

        return SignupResponseDto(
            tenant_id=tenant_id,
            message="Tenant created successfully",
            next_steps=[
                "Complete company profile setup",
                "Invite team members", 
                "Configure business settings",
            ],
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=30 * 60
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

        tenant.updated_at = datetime.now(timezone.utc)
        
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
            created_at=datetime.now(timezone.utc)
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
            created_at=datetime.now(timezone.utc)
        )
        created_user = self.user_repo.create(user)

        # Create user-tenant relationship
        user_tenant = UserTenant(
            id=uuid4(),
            user_id=user_id,
            tenant_id=tenant_id,
            roles=roles or [],
            is_primary_tenant=False,
            joined_at=datetime.now(timezone.utc)
        )
        self.user_tenant_repo.create(user_tenant)

        return map_user_to_dto(created_user)


class InvitationService:
    def __init__(
        self, 
        invite_repo: InviteRepository,
        user_repo: UserRepository,
        user_tenant_repo: UserTenantRepository,
        tenant_repo: TenantRepository,
        audit_repo: AuditLogRepository,
        auth_token_repo: AuthTokenRepository
    ):
        self.invite_repo = invite_repo
        self.user_repo = user_repo
        self.user_tenant_repo = user_tenant_repo
        self.tenant_repo = tenant_repo
        self.audit_repo = audit_repo
        self.auth_token_repo = auth_token_repo
        
        # Import email service
        from .email_service import EmailService
        self.email_service = EmailService()
        
        # Import token service
        from .token_service import TokenService
        self.token_service = TokenService(auth_token_repo)

    def create_invitation(
        self, 
        payload: CreateInviteDto, 
        tenant_id: UUID, 
        inviter_user_id: UUID, 
        ip_address: str = None
    ) -> InviteDto:
        """
        Create and send invitation to a new user.
        
        Steps:
        1. Validate email doesn't already exist as a user
        2. Check if there's already a pending invitation for this email in this tenant
        3. Generate secure token
        4. Create invitation record
        5. Send invitation email
        6. Create audit log
        """
        
        # Validate email doesn't already exist as user
        if self.user_repo.email_exists(payload.email):
            raise ValueError(f"User with email '{payload.email}' already exists")
        
        # Check for existing pending invitation
        existing_invite = self.invite_repo.get_by_email_and_tenant(payload.email, tenant_id)
        if existing_invite:
            raise ValueError(f"Pending invitation already exists for email '{payload.email}'")
        
        # Get tenant info for email
        tenant = self.tenant_repo.get_by_id(tenant_id)
        if not tenant:
            raise ValueError(f"Tenant with ID '{tenant_id}' not found")
        
        # Get inviter info for email
        inviter = self.user_repo.get_by_id(inviter_user_id)
        if not inviter:
            raise ValueError(f"Inviter user with ID '{inviter_user_id}' not found")
        
        # Generate secure token
        token = generate_secure_token()
        
        # Calculate expiration (7 days from now)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        # Create invitation
        invitation = Invite(
            id=uuid4(),
            tenant_id=tenant_id,
            email=payload.email,
            roles=payload.roles,
            token=token,
            expires_at=expires_at,
            status="pending",
            created_at=datetime.now(timezone.utc)
        )
        
        created_invitation = self.invite_repo.create(invitation)
        
        # Send invitation email
        invitation_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/accept-invitation/{token}"
        
        email_sent = self.email_service.send_invitation_email(
            recipient_email=payload.email,
            recipient_name="",  # We don't have the name yet
            company_name=tenant.name,
            inviter_name=inviter.name,
            invitation_link=invitation_link,
            roles=payload.roles
        )
        
        # Create audit log
        audit_log = AuditLog(
            id=uuid4(),
            tenant_id=tenant_id,
            user_id=inviter_user_id,
            action="invite.created",
            resource="invite",
            resource_id=str(created_invitation.id),
            payload={
                "email": payload.email,
                "roles": payload.roles,
                "email_sent": email_sent
            },
            ip_address=ip_address,
            created_at=datetime.now(timezone.utc)
        )
        self.audit_repo.create(audit_log)
        
        if not email_sent:
            # Log warning but don't fail the invitation creation
            print(f"Warning: Failed to send invitation email to {payload.email}")
        
        return map_invite_to_dto(created_invitation)

    def validate_invitation(self, token: str) -> InviteDto:
        """
        Validate invitation token and return invitation details.
        
        Checks:
        1. Token exists
        2. Token not expired
        3. Invitation status is pending
        """
        
        invitation = self.invite_repo.get_by_token(token)
        if not invitation:
            raise ValueError("Invalid invitation token")
        
        if invitation.status != "pending":
            raise ValueError("Invitation has already been used or expired")
        
        if invitation.expires_at < datetime.now(timezone.utc):
            # Mark as expired
            invitation.status = "expired"
            self.invite_repo.update(invitation)
            raise ValueError("Invitation has expired")
        
        return map_invite_to_dto(invitation)

    def accept_invitation(
        self, 
        token: str, 
        payload: AcceptInviteDto, 
        ip_address: str = None
    ) -> LoginResponseDto:
        """
        Accept invitation and create user account.
        
        Steps:
        1. Validate invitation token
        2. Create user account
        3. Assign user to tenant with specified roles
        4. Mark invitation as accepted
        5. Generate auth tokens
        6. Create audit log
        """
        
        # Validate invitation
        invitation = self.invite_repo.get_by_token(token)
        if not invitation:
            raise ValueError("Invalid invitation token")
        
        if invitation.status != "pending":
            raise ValueError("Invitation has already been used or expired")
        
        if invitation.expires_at < datetime.now(timezone.utc):
            # Mark as expired
            invitation.status = "expired"
            self.invite_repo.update(invitation)
            raise ValueError("Invitation has expired")
        
        # Check if user already exists (double-check)
        if self.user_repo.email_exists(invitation.email):
            raise ValueError(f"User with email '{invitation.email}' already exists")
        
        # Create user account
        user_id = uuid4()
        user = User(
            id=user_id,
            email=invitation.email,
            password_hash=hash_password(payload.password),
            name=payload.name,
            status="active",
            is_verified=True,  # Email is verified through invitation
            mfa_enabled=False,
            created_at=datetime.now(timezone.utc)
        )
        created_user = self.user_repo.create(user)
        
        # Create user-tenant relationship
        user_tenant = UserTenant(
            id=uuid4(),
            user_id=user_id,
            tenant_id=invitation.tenant_id,
            roles=invitation.roles,
            is_primary_tenant=True,  # First tenant is primary
            joined_at=datetime.now(timezone.utc)
        )
        self.user_tenant_repo.create(user_tenant)
        
        # Mark invitation as accepted
        invitation.status = "accepted"
        invitation.accepted_at = datetime.now(timezone.utc)
        self.invite_repo.update(invitation)
        
        # Generate auth tokens
        access_token = self.token_service.generate_access_token(created_user, invitation.tenant_id)
        refresh_token = self.token_service.generate_refresh_token(created_user, invitation.tenant_id, ip_address)
        
        # Get tenant info for response
        tenant = self.tenant_repo.get_by_id(invitation.tenant_id)
        
        # Create audit log
        audit_log = AuditLog(
            id=uuid4(),
            tenant_id=invitation.tenant_id,
            user_id=user_id,
            action="invite.accepted",
            resource="invite",
            resource_id=str(invitation.id),
            payload={
                "email": invitation.email,
                "roles": invitation.roles
            },
            ip_address=ip_address,
            created_at=datetime.now(timezone.utc)
        )
        self.audit_repo.create(audit_log)
        
        # Return login response
        return LoginResponseDto(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=30 * 60,  # 30 minutes
            user=UserLoginDto(
                id=str(created_user.id),
                email=created_user.email,
                name=created_user.name,
                status=created_user.status,
                is_verified=created_user.is_verified,
                mfa_enabled=created_user.mfa_enabled
            ),
            tenant=TenantLoginDto(
                id=str(invitation.tenant_id),
                name=tenant.name if tenant else None,
                domain=tenant.domain if tenant else None,
                roles=invitation.roles
            )
        )


