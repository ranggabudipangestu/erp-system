from typing import Optional, List
from uuid import UUID, uuid4

from sqlalchemy import select, and_, update
from sqlalchemy.orm import Session, selectinload

from .models import Tenant, User, UserTenant, Role, Invite, AuthToken, AuditLog, PermissionPolicy


class TenantRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, id: UUID) -> Optional[Tenant]:
        return self.session.get(Tenant, id)

    def get_by_domain(self, domain: str) -> Optional[Tenant]:
        stmt = select(Tenant).where(Tenant.domain == domain)
        return self.session.execute(stmt).scalar_one_or_none()

    def create(self, tenant: Tenant) -> Tenant:
        self.session.add(tenant)
        self.session.flush()
        return tenant

    def update(self, tenant: Tenant) -> Tenant:
        self.session.flush()
        return tenant

    def domain_exists(self, domain: str) -> bool:
        return self.get_by_domain(domain) is not None


class UserRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, id: UUID) -> Optional[User]:
        return self.session.get(User, id)

    def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        return self.session.execute(stmt).scalar_one_or_none()

    def get_with_tenants(self, id: UUID) -> Optional[User]:
        stmt = (
            select(User)
            .options(selectinload(User.tenants).selectinload(UserTenant.tenant))
            .where(User.id == id)
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def create(self, user: User) -> User:
        self.session.add(user)
        self.session.flush()
        return user

    def update(self, user: User) -> User:
        self.session.flush()
        return user

    def email_exists(self, email: str) -> bool:
        return self.get_by_email(email) is not None
    
    def get_primary_tenant(self, user_id: UUID) -> Optional['UserTenant']:
        """Get user's primary tenant relationship"""
        stmt = (
            select(UserTenant)
            .where(
                UserTenant.user_id == user_id,
                UserTenant.is_primary_tenant == True
            )
            .options(selectinload(UserTenant.tenant))
        )
        return self.session.scalar(stmt)


class UserTenantRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_user_and_tenant(self, user_id: UUID, tenant_id: UUID) -> Optional[UserTenant]:
        stmt = select(UserTenant).where(
            and_(UserTenant.user_id == user_id, UserTenant.tenant_id == tenant_id)
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def get_by_user(self, user_id: UUID) -> List[UserTenant]:
        stmt = (
            select(UserTenant)
            .options(selectinload(UserTenant.tenant))
            .where(UserTenant.user_id == user_id)
        )
        return list(self.session.execute(stmt).scalars().all())

    def get_primary_tenant(self, user_id: UUID) -> Optional[UserTenant]:
        stmt = select(UserTenant).where(
            and_(UserTenant.user_id == user_id, UserTenant.is_primary_tenant == True)
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def create(self, user_tenant: UserTenant) -> UserTenant:
        self.session.add(user_tenant)
        self.session.flush()
        return user_tenant

    def update(self, user_tenant: UserTenant) -> UserTenant:
        self.session.flush()
        return user_tenant


class RoleRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, id: UUID) -> Optional[Role]:
        return self.session.get(Role, id)

    def get_system_roles(self) -> List[Role]:
        stmt = select(Role).where(Role.is_system_role == True)
        return list(self.session.execute(stmt).scalars().all())

    def get_by_tenant(self, tenant_id: UUID) -> List[Role]:
        stmt = select(Role).where(Role.tenant_id == tenant_id)
        return list(self.session.execute(stmt).scalars().all())

    def get_by_name_and_tenant(self, name: str, tenant_id: UUID = None) -> Optional[Role]:
        if tenant_id:
            stmt = select(Role).where(and_(Role.name == name, Role.tenant_id == tenant_id))
        else:
            stmt = select(Role).where(and_(Role.name == name, Role.is_system_role == True))
        return self.session.execute(stmt).scalar_one_or_none()

    def create(self, role: Role) -> Role:
        self.session.add(role)
        self.session.flush()
        return role

    def create_many(self, roles: List[Role]) -> List[Role]:
        self.session.add_all(roles)
        self.session.flush()
        return roles


class InviteRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_token(self, token: str) -> Optional[Invite]:
        stmt = select(Invite).where(Invite.token == token)
        return self.session.execute(stmt).scalar_one_or_none()

    def get_by_email_and_tenant(self, email: str, tenant_id: UUID) -> Optional[Invite]:
        stmt = select(Invite).where(
            and_(Invite.email == email, Invite.tenant_id == tenant_id, Invite.status == "pending")
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def create(self, invite: Invite) -> Invite:
        self.session.add(invite)
        self.session.flush()
        return invite

    def update(self, invite: Invite) -> Invite:
        self.session.flush()
        return invite


class AuthTokenRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_refresh_token_hash(self, token_hash: str) -> Optional[AuthToken]:
        stmt = select(AuthToken).where(
            and_(AuthToken.refresh_token_hash == token_hash, AuthToken.revoked_at.is_(None))
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def get_active_by_user_tenant(self, user_id: UUID, tenant_id: UUID) -> List[AuthToken]:
        stmt = select(AuthToken).where(
            and_(
                AuthToken.user_id == user_id,
                AuthToken.tenant_id == tenant_id,
                AuthToken.revoked_at.is_(None)
            )
        )
        return list(self.session.execute(stmt).scalars().all())

    def create(self, auth_token: AuthToken) -> AuthToken:
        self.session.add(auth_token)
        self.session.flush()
        return auth_token

    def update(self, auth_token: AuthToken) -> AuthToken:
        self.session.flush()
        return auth_token
    
    def get_valid_refresh_token(self, token_value: str) -> Optional[AuthToken]:
        """Get valid (non-expired, non-revoked) refresh token by value"""
        from datetime import datetime, timezone
        import hashlib

        token_hash = hashlib.sha256(token_value.encode()).hexdigest()
        stmt = (
            select(AuthToken)
            .where(
                AuthToken.refresh_token_hash == token_hash,
                AuthToken.expires_at > datetime.now(timezone.utc),
                AuthToken.revoked_at.is_(None)
            )
            .options(selectinload(AuthToken.user))
        )

        return self.session.scalar(stmt)
    
    def revoke_token(self, token_value: str, user_id: UUID) -> bool:
        """Revoke a specific token by its plain value"""
        from datetime import datetime, timezone
        import hashlib

        token_hash = hashlib.sha256(token_value.encode()).hexdigest()
        stmt = (
            update(AuthToken)
            .where(
                AuthToken.refresh_token_hash == token_hash,
                AuthToken.user_id == user_id,
                AuthToken.revoked_at.is_(None)
            )
            .values(revoked_at=datetime.now(timezone.utc))
        )

        result = self.session.execute(stmt)
        self.session.flush()
        return result.rowcount > 0
    
    def revoke_all_user_tokens(self, user_id: UUID, tenant_id: Optional[UUID] = None) -> int:
        """Revoke all tokens for a user, optionally scoped to tenant"""
        from datetime import datetime
        
        conditions = [
            AuthToken.user_id == user_id,
            AuthToken.revoked_at.is_(None)
        ]
        
        if tenant_id:
            conditions.append(AuthToken.tenant_id == tenant_id)
        
        stmt = (
            update(AuthToken)
            .where(*conditions)
            .values(revoked_at=datetime.utcnow())
        )
        
        result = self.session.execute(stmt)
        self.session.flush()
        return result.rowcount


class AuditLogRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, audit_log: AuditLog) -> AuditLog:
        self.session.add(audit_log)
        self.session.flush()
        return audit_log

    def get_by_tenant(self, tenant_id: UUID, limit: int = 100) -> List[AuditLog]:
        stmt = (
            select(AuditLog)
            .where(AuditLog.tenant_id == tenant_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        return list(self.session.execute(stmt).scalars().all())
