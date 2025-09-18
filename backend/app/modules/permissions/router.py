from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.modules.permissions.schemas import (
    RoleCreate, RoleUpdate, RoleWithPermissions, 
    AvailableMenusResponse, SubscriptionPlanSchema,
    UserPermissionsResponse, ModuleSchema, MenuItemWithModule
)
from app.modules.permissions.service import PermissionService
from app.core.db import session_scope
from app.modules.auth.service import AuthService


router = APIRouter()


def get_db():
    """Dependency to get database session"""
    with session_scope() as session:
        yield session


def get_permission_service(db: Session = Depends(get_db)) -> PermissionService:
    """Dependency to get permission service"""
    return PermissionService(db)


def get_current_user():
    """Dependency to get current user context - to be implemented based on your auth system"""
    # This should return user context with user_id and tenant_id
    # For now, returning a mock structure - replace with actual implementation
    class UserContext:
        def __init__(self):
            self.user_id = UUID("00000000-0000-0000-0000-000000000000")
            self.tenant_id = UUID("00000000-0000-0000-0000-000000000000")
    
    return UserContext()


def require_permission(permission_key: str):
    """Dependency to require specific permission"""
    def dependency(current_user=Depends(get_current_user)):
        # TODO: Implement actual permission checking
        # For now, just return the user context
        return current_user
    return dependency


@router.get("/available-menus", response_model=AvailableMenusResponse)
async def get_available_menus(
    current_user=Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Get available menus based on current tenant's subscription plan"""
    return permission_service.get_available_menus_for_tenant(current_user.tenant_id)


@router.get("/modules", response_model=List[ModuleSchema])
async def get_modules(
    current_user=Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Get all modules"""
    return permission_service.get_all_modules()


@router.get("/menu-items", response_model=List[MenuItemWithModule])
async def get_menu_items(
    current_user=Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Get all menu items with their modules"""
    return permission_service.get_all_menu_items()


@router.get("/roles", response_model=List[RoleWithPermissions])
async def get_roles(
    current_user=Depends(require_permission("roles.view")),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Get all roles for current tenant"""
    return permission_service.get_roles_for_tenant(current_user.tenant_id)


@router.get("/roles/{role_id}", response_model=RoleWithPermissions)
async def get_role(
    role_id: UUID,
    current_user=Depends(require_permission("roles.view")),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Get specific role with permissions"""
    role = permission_service.get_role_by_id(role_id, current_user.tenant_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return role


@router.post("/roles", response_model=RoleWithPermissions)
async def create_role(
    role_data: RoleCreate,
    current_user=Depends(require_permission("roles.create")),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Create a new role"""
    return permission_service.create_role(
        tenant_id=current_user.tenant_id,
        role_data=role_data,
        created_by=current_user.user_id
    )


@router.put("/roles/{role_id}", response_model=RoleWithPermissions)
async def update_role(
    role_id: UUID,
    role_data: RoleUpdate,
    current_user=Depends(require_permission("roles.edit")),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Update role and permissions"""
    return permission_service.update_role(
        role_id=role_id,
        tenant_id=current_user.tenant_id,
        role_data=role_data,
        updated_by=current_user.user_id
    )


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: UUID,
    current_user=Depends(require_permission("roles.delete")),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Delete a role"""
    success = permission_service.delete_role(
        role_id=role_id,
        tenant_id=current_user.tenant_id,
        deleted_by=current_user.user_id
    )
    return {"message": "Role deleted successfully"}


@router.get("/subscription-plans", response_model=List[SubscriptionPlanSchema])
async def get_subscription_plans(
    current_user=Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Get all subscription plans"""
    return permission_service.get_subscription_plans()


@router.get("/user-permissions")
async def get_user_permissions(
    current_user=Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service)
):
    print("CHECK user permission endpoint", current_user)
    """Get current user's effective permissions"""
    permissions = permission_service.get_user_permissions(
        current_user.user_id, 
        current_user.tenant_id
    )
    return {"permissions": permissions}