from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.modules.permissions.schemas import (
    RoleCreate,
    RoleUpdate,
    RoleWithPermissions,
    AvailableMenusResponse,
    SubscriptionPlanSchema,
    ModuleSchema,
    MenuItemWithModule,
    NavigationResponse,
)
from app.modules.permissions.service import PermissionService
from app.core.db import session_scope
from app.core.security import (
    SecurityPrincipal,
    get_current_principal,
    require_permissions,
    require_any_permission,
)


router = APIRouter()


def get_db():
    """Dependency to get database session"""
    with session_scope() as session:
        yield session


def get_permission_service(db: Session = Depends(get_db)) -> PermissionService:
    """Dependency to get permission service"""
    return PermissionService(db)

@router.get("/available-menus", response_model=AvailableMenusResponse)
async def get_available_menus(
    principal: SecurityPrincipal = Depends(get_current_principal),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Get available menus based on current tenant's subscription plan"""
    return permission_service.get_available_menus_for_tenant(principal.tenant_id)


@router.get("/modules", response_model=List[ModuleSchema])
async def get_modules(
    principal: SecurityPrincipal = Depends(get_current_principal),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Get all modules"""
    return permission_service.get_all_modules()


@router.get("/menu-items", response_model=List[MenuItemWithModule])
async def get_menu_items(
    principal: SecurityPrincipal = Depends(get_current_principal),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Get all menu items with their modules"""
    return permission_service.get_all_menu_items()


@router.get("/roles", response_model=List[RoleWithPermissions])
async def get_roles(
    principal: SecurityPrincipal = Depends(require_permissions(["roles.view"])),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Get all roles for current tenant"""
    return permission_service.get_roles_for_tenant(principal.tenant_id)


@router.get("/roles/{role_id}", response_model=RoleWithPermissions)
async def get_role(
    role_id: UUID,
    principal: SecurityPrincipal = Depends(require_permissions(["roles.view"])),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Get specific role with permissions"""
    role = permission_service.get_role_by_id(role_id, principal.tenant_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return role


@router.post("/roles", response_model=RoleWithPermissions)
async def create_role(
    role_data: RoleCreate,
    principal: SecurityPrincipal = Depends(require_permissions(["roles.create"])),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Create a new role"""
    return permission_service.create_role(
        tenant_id=principal.tenant_id,
        role_data=role_data,
        created_by=principal.user_id
    )


@router.put("/roles/{role_id}", response_model=RoleWithPermissions)
async def update_role(
    role_id: UUID,
    role_data: RoleUpdate,
    principal: SecurityPrincipal = Depends(require_any_permission(["roles.update", "roles.edit"])),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Update role and permissions"""
    return permission_service.update_role(
        role_id=role_id,
        tenant_id=principal.tenant_id,
        role_data=role_data,
        updated_by=principal.user_id
    )


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: UUID,
    principal: SecurityPrincipal = Depends(require_permissions(["roles.delete"])),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Delete a role"""
    success = permission_service.delete_role(
        role_id=role_id,
        tenant_id=principal.tenant_id,
        deleted_by=principal.user_id
    )
    return {"message": "Role deleted successfully"}


@router.get("/subscription-plans", response_model=List[SubscriptionPlanSchema])
async def get_subscription_plans(
    principal: SecurityPrincipal = Depends(get_current_principal),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Get all subscription plans"""
    return permission_service.get_subscription_plans()


@router.get("/user-permissions")
async def get_user_permissions(
    principal: SecurityPrincipal = Depends(get_current_principal),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Get current user's effective permissions"""
    permissions = permission_service.get_user_permissions(
        principal.user_id, 
        principal.tenant_id
    )
    if not permissions:
        permissions = {
            perm: {
                "can_view": True,
                "can_create": False,
                "can_edit": False,
                "can_delete": False,
                "can_export": False,
            }
            for perm in principal.permissions
        }
    return {"permissions": permissions}


@router.get("/navigation", response_model=NavigationResponse)
async def get_navigation(
    principal: SecurityPrincipal = Depends(get_current_principal),
    permission_service: PermissionService = Depends(get_permission_service),
):
    navigation_modules = permission_service.get_navigation_for_user(
        principal.tenant_id,
        set(principal.permissions),
    )
    return NavigationResponse(modules=navigation_modules)
