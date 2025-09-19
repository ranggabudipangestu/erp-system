from datetime import datetime
from uuid import UUID
from sqlalchemy import String, Boolean, Integer, Text, ForeignKey, DECIMAL, DateTime, UniqueConstraint
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.core.db import Base


class Module(Base):
    """Module/Category definitions for menu organization"""
    __tablename__ = "modules"

    id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
    code: Mapped[str] = mapped_column("code", String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column("name", String(100), nullable=False)
    description: Mapped[str | None] = mapped_column("description", Text, nullable=True)
    parent_id: Mapped[UUID | None] = mapped_column("parent_id", PG_UUID(as_uuid=True), ForeignKey("modules.id"), nullable=True)
    sort_order: Mapped[int] = mapped_column("sort_order", Integer, nullable=False, default=0)
    icon: Mapped[str | None] = mapped_column("icon", String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column("is_active", Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    menu_items: Mapped[list["MenuItem"]] = relationship("MenuItem", back_populates="module")
    parent: Mapped["Module | None"] = relationship("Module", remote_side=[id])
    children: Mapped[list["Module"]] = relationship("Module", back_populates="parent")


class MenuItem(Base):
    """Menu items within modules"""
    __tablename__ = "menu_items"
    __table_args__ = (
        UniqueConstraint("module_id", "code", name="uq_menu_items_module_code"),
    )

    id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
    module_id: Mapped[UUID] = mapped_column("module_id", PG_UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False)
    code: Mapped[str] = mapped_column("code", String(50), nullable=False)
    name: Mapped[str] = mapped_column("name", String(100), nullable=False)
    description: Mapped[str | None] = mapped_column("description", Text, nullable=True)
    route: Mapped[str | None] = mapped_column("route", String(200), nullable=True)
    permission_key: Mapped[str] = mapped_column("permission_key", String(100), nullable=False)
    sort_order: Mapped[int] = mapped_column("sort_order", Integer, nullable=False, default=0)
    icon: Mapped[str | None] = mapped_column("icon", String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column("is_active", Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    module: Mapped["Module"] = relationship("Module", back_populates="menu_items")
    plan_menu_items: Mapped[list["PlanMenuItem"]] = relationship("PlanMenuItem", back_populates="menu_item")
    role_permissions: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="menu_item")


class SubscriptionPlan(Base):
    """Subscription plans and their features"""
    __tablename__ = "subscription_plans"

    id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
    code: Mapped[str] = mapped_column("code", String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column("name", String(100), nullable=False)
    description: Mapped[str | None] = mapped_column("description", Text, nullable=True)
    price_monthly: Mapped[float | None] = mapped_column("price_monthly", DECIMAL(10, 2), nullable=True)
    price_yearly: Mapped[float | None] = mapped_column("price_yearly", DECIMAL(10, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column("is_active", Boolean, nullable=False, default=True)
    sort_order: Mapped[int] = mapped_column("sort_order", Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    plan_menu_items: Mapped[list["PlanMenuItem"]] = relationship("PlanMenuItem", back_populates="plan")
    tenants: Mapped[list["Tenant"]] = relationship("Tenant", back_populates="subscription_plan")


class PlanMenuItem(Base):
    """Plan features - what menu items are available per plan"""
    __tablename__ = "plan_menu_items"
    __table_args__ = (
        UniqueConstraint("plan_id", "menu_item_id", name="uq_plan_menu_items_plan_menu"),
    )

    id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
    plan_id: Mapped[UUID] = mapped_column("plan_id", PG_UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=False)
    menu_item_id: Mapped[UUID] = mapped_column("menu_item_id", PG_UUID(as_uuid=True), ForeignKey("menu_items.id"), nullable=False)
    is_included: Mapped[bool] = mapped_column("is_included", Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    plan: Mapped["SubscriptionPlan"] = relationship("SubscriptionPlan", back_populates="plan_menu_items")
    menu_item: Mapped["MenuItem"] = relationship("MenuItem", back_populates="plan_menu_items")


class RolePermission(Base):
    """Role permissions - what each role can access"""
    __tablename__ = "role_permissions"
    __table_args__ = (
        UniqueConstraint("role_id", "menu_item_id", name="uq_role_permissions_role_menu"),
    )

    id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
    role_id: Mapped[UUID] = mapped_column("role_id", PG_UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    menu_item_id: Mapped[UUID] = mapped_column("menu_item_id", PG_UUID(as_uuid=True), ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False)
    can_view: Mapped[bool] = mapped_column("can_view", Boolean, nullable=False, default=False)
    can_create: Mapped[bool] = mapped_column("can_create", Boolean, nullable=False, default=False)
    can_edit: Mapped[bool] = mapped_column("can_edit", Boolean, nullable=False, default=False)
    can_delete: Mapped[bool] = mapped_column("can_delete", Boolean, nullable=False, default=False)
    can_export: Mapped[bool] = mapped_column("can_export", Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column("updated_at", DateTime(timezone=True), nullable=True, onupdate=func.now())

    # Relationships
    role: Mapped["Role"] = relationship("Role", back_populates="role_permissions")
    menu_item: Mapped["MenuItem"] = relationship("MenuItem", back_populates="role_permissions")


# Update the existing auth models to support the new permission system
# We need to import and extend the existing models
try:
    from app.modules.auth.models import Role as BaseRole, Tenant as BaseTenant
    
    # Update the Role model to work with the new permission system
    BaseRole.role_permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")

    # Update the Tenant model to include subscription plan if it hasn't already been mapped
    if not hasattr(BaseTenant, "subscription_plan_id"):
        BaseTenant.subscription_plan_id = mapped_column(
            "subscription_plan_id", PG_UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=True
        )
    if not hasattr(BaseTenant, "subscription_plan"):
        BaseTenant.subscription_plan = relationship("SubscriptionPlan", back_populates="tenants")
    
    # Create aliases for consistency
    Role = BaseRole
    Tenant = BaseTenant
    
except ImportError:
    # If auth models don't exist yet, create them here
    class Role(Base):
        """Enhanced Role model"""
        __tablename__ = "roles"
        __table_args__ = (
            UniqueConstraint("tenant_id", "name", name="uq_roles_tenant_name"),
        )

        id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
        tenant_id: Mapped[UUID | None] = mapped_column("tenant_id", PG_UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=True)
        name: Mapped[str] = mapped_column("name", String(50), nullable=False)
        description: Mapped[str | None] = mapped_column("description", Text, nullable=True)
        is_system: Mapped[bool] = mapped_column("is_system", Boolean, nullable=False, default=False)
        created_at: Mapped[datetime] = mapped_column(
            "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
        )
        updated_at: Mapped[datetime | None] = mapped_column("updated_at", DateTime(timezone=True), nullable=True, onupdate=func.now())

        # Relationships
        role_permissions: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
        tenant: Mapped["Tenant | None"] = relationship("Tenant", back_populates="roles")

    class Tenant(Base):
        """Enhanced Tenant model"""
        __tablename__ = "tenants"

        id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
        name: Mapped[str] = mapped_column("name", String(200), nullable=False)
        domain: Mapped[str | None] = mapped_column("domain", String(100), nullable=True, unique=True)
        subscription_plan_id: Mapped[UUID | None] = mapped_column("subscription_plan_id", PG_UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=True)
        is_active: Mapped[bool] = mapped_column("is_active", Boolean, nullable=False, default=True)
        created_at: Mapped[datetime] = mapped_column(
            "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
        )
        updated_at: Mapped[datetime | None] = mapped_column("updated_at", DateTime(timezone=True), nullable=True)

        # Relationships
        subscription_plan: Mapped["SubscriptionPlan | None"] = relationship("SubscriptionPlan", back_populates="tenants")
        roles: Mapped[list["Role"]] = relationship("Role", back_populates="tenant")
