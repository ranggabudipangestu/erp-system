from datetime import datetime
from uuid import UUID
from sqlalchemy import String, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.core.db import Base


class Tenant(Base):
    __tablename__ = "tenants"
    __table_args__ = (
        {},
    )

    id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column("name", String(200), nullable=False)
    domain: Mapped[str] = mapped_column("domain", String(100), nullable=True, unique=True)
    industry: Mapped[str | None] = mapped_column("industry", String(100), nullable=True)
    settings: Mapped[dict | None] = mapped_column("settings", JSON, nullable=True)  # currency, locale, tax_profile
    plan: Mapped[str] = mapped_column("plan", String(50), nullable=False, default="basic")
    region: Mapped[str] = mapped_column("region", String(50), nullable=False, default="ap-southeast-1")
    deployment_mode: Mapped[str] = mapped_column("deployment_mode", String(20), nullable=False, default="shared")  # shared|schema|db|onprem
    is_active: Mapped[bool] = mapped_column("is_active", Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column("updated_at", DateTime(timezone=True), nullable=True)

    # Add subscription_plan_id column for the new permission system
    subscription_plan_id: Mapped[UUID | None] = mapped_column("subscription_plan_id", PG_UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=True)

    # Relationships
    users: Mapped[list["UserTenant"]] = relationship("UserTenant", back_populates="tenant")
    roles: Mapped[list["Role"]] = relationship("Role", back_populates="tenant")
    invites: Mapped[list["Invite"]] = relationship("Invite", back_populates="tenant")
    auth_tokens: Mapped[list["AuthToken"]] = relationship("AuthToken", back_populates="tenant")
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="tenant")
    # Note: SubscriptionPlan relationship will be handled by the permissions module


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        {},
    )

    id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
    email: Mapped[str] = mapped_column("email", String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column("password_hash", String(255), nullable=False)
    name: Mapped[str] = mapped_column("name", String(200), nullable=False)
    status: Mapped[str] = mapped_column("status", String(20), nullable=False, default="active")  # active|inactive|pending
    is_verified: Mapped[bool] = mapped_column("is_verified", Boolean, nullable=False, default=False)
    mfa_enabled: Mapped[bool] = mapped_column("mfa_enabled", Boolean, nullable=False, default=False)
    mfa_secret: Mapped[str | None] = mapped_column("mfa_secret", String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column("updated_at", DateTime(timezone=True), nullable=True)

    # Relationships
    tenants: Mapped[list["UserTenant"]] = relationship("UserTenant", back_populates="user")
    auth_tokens: Mapped[list["AuthToken"]] = relationship("AuthToken", back_populates="user")
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="user")


class UserTenant(Base):
    __tablename__ = "user_tenants"
    __table_args__ = (
        {},
    )

    id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column("user_id", PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id: Mapped[UUID] = mapped_column("tenant_id", PG_UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    roles: Mapped[list[str]] = mapped_column("roles", JSON, nullable=False, default=list)  # Array of role names
    is_primary_tenant: Mapped[bool] = mapped_column("is_primary_tenant", Boolean, nullable=False, default=False)
    joined_at: Mapped[datetime] = mapped_column(
        "joined_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column("updated_at", DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="tenants")
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="users")


class Role(Base):
    __tablename__ = "roles"
    __table_args__ = (
        {},
    )

    id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
    tenant_id: Mapped[UUID | None] = mapped_column("tenant_id", PG_UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=True)  # null for system roles
    name: Mapped[str] = mapped_column("name", String(100), nullable=False)
    description: Mapped[str | None] = mapped_column("description", String(500), nullable=True)
    permissions: Mapped[list[str]] = mapped_column("permissions", JSON, nullable=False, default=list)
    is_system_role: Mapped[bool] = mapped_column("is_system_role", Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column("updated_at", DateTime(timezone=True), nullable=True)

    # Relationships
    tenant: Mapped["Tenant | None"] = relationship("Tenant", back_populates="roles")
    # Note: RolePermission relationship will be handled by the permissions module


class Invite(Base):
    __tablename__ = "invites"
    __table_args__ = (
        {},
    )

    id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
    tenant_id: Mapped[UUID] = mapped_column("tenant_id", PG_UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    email: Mapped[str] = mapped_column("email", String(255), nullable=False)
    roles: Mapped[list[str]] = mapped_column("roles", JSON, nullable=False, default=list)
    token: Mapped[str] = mapped_column("token", String(255), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column("expires_at", DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column("status", String(20), nullable=False, default="pending")  # pending|accepted|expired
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    accepted_at: Mapped[datetime | None] = mapped_column("accepted_at", DateTime(timezone=True), nullable=True)

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="invites")


class AuthToken(Base):
    __tablename__ = "auth_tokens"
    __table_args__ = (
        {},
    )

    id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column("user_id", PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id: Mapped[UUID] = mapped_column("tenant_id", PG_UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    refresh_token_hash: Mapped[str] = mapped_column("refresh_token_hash", String(255), nullable=False)
    device_info: Mapped[str | None] = mapped_column("device_info", Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column("ip_address", String(45), nullable=True)  # IPv6 support
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column("expires_at", DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column("revoked_at", DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="auth_tokens")
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="auth_tokens")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        {},
    )

    id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
    tenant_id: Mapped[UUID | None] = mapped_column(
        "tenant_id", PG_UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=True
    )
    user_id: Mapped[UUID | None] = mapped_column("user_id", PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column("action", String(100), nullable=False)  # signup, login, invite, role_change, etc.
    resource: Mapped[str | None] = mapped_column("resource", String(100), nullable=True)  # user, role, tenant, etc.
    resource_id: Mapped[str | None] = mapped_column("resource_id", String(100), nullable=True)
    payload: Mapped[dict | None] = mapped_column("payload", JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column("ip_address", String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column("user_agent", Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="audit_logs")
    user: Mapped["User | None"] = relationship("User", back_populates="audit_logs")
