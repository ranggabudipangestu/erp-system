from typing import List, Dict, Optional, Any
from uuid import UUID
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import and_, or_
from fastapi import HTTPException, status

from app.modules.permissions.models import (
    Module, MenuItem, RolePermission, 
    SubscriptionPlan, PlanMenuItem
)
from app.modules.auth.models import Role, Tenant, UserTenant
from app.modules.permissions.schemas import (
    RoleCreate, RoleUpdate, RoleWithPermissions,
    AvailableMenusResponse, ModuleSchema, MenuItemWithModule,
    RoleSchema, SubscriptionPlanSchema
)


class PermissionService:
    def __init__(self, db: Session):
        self.db = db

    def get_available_menus_for_tenant(self, tenant_id: UUID) -> AvailableMenusResponse:
        """Get available menus based on tenant's subscription plan"""
        
        # Get tenant with subscription plan
        tenant = self.db.query(Tenant).options(
            selectinload(Tenant.subscription_plan)
        ).filter(Tenant.id == tenant_id).first()
        
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        if not tenant.subscription_plan:
            # If no subscription plan is set, use the legacy 'plan' field or default to basic
            plan_code = getattr(tenant, 'plan', 'basic')
            subscription_plan = self.db.query(SubscriptionPlan).filter(
                SubscriptionPlan.code == plan_code
            ).first()
            
            if not subscription_plan:
                # Create a default basic plan if it doesn't exist
                subscription_plan = SubscriptionPlan(
                    code="basic",
                    name="Basic Plan",
                    description="Default basic plan",
                    is_active=True,
                    sort_order=1
                )
                self.db.add(subscription_plan)
                self.db.flush()
        else:
            subscription_plan = tenant.subscription_plan
        
        # Get menu items available for this plan
        available_menu_items = self.db.query(MenuItem).join(
            PlanMenuItem, MenuItem.id == PlanMenuItem.menu_item_id
        ).filter(
            and_(
                PlanMenuItem.plan_id == subscription_plan.id,
                PlanMenuItem.is_included == True,
                MenuItem.is_active == True
            )
        ).options(
            selectinload(MenuItem.module)
        ).order_by(MenuItem.sort_order).all()
        
        # Get modules that have available menu items
        module_ids = list(set([item.module_id for item in available_menu_items]))
        modules = self.db.query(Module).filter(
            and_(
                Module.id.in_(module_ids),
                Module.is_active == True
            )
        ).order_by(Module.sort_order).all()
        
        return AvailableMenusResponse(
            modules=[ModuleSchema.model_validate(m) for m in modules],
            menu_items=[MenuItemWithModule.model_validate(item) for item in available_menu_items],
            current_plan=subscription_plan.code,
            plan_name=subscription_plan.name
        )

    def get_roles_for_tenant(self, tenant_id: UUID) -> List[RoleWithPermissions]:
        """Get all roles for a tenant with their permissions"""
        
        roles = self.db.query(Role).options(
            selectinload(Role.role_permissions).selectinload(RolePermission.menu_item).selectinload(MenuItem.module)
        ).filter(Role.tenant_id == tenant_id).order_by(Role.name).all()
        
        return [RoleWithPermissions.model_validate(role) for role in roles]

    def get_role_by_id(self, role_id: UUID, tenant_id: UUID) -> Optional[RoleWithPermissions]:
        """Get a specific role with permissions"""
        
        role = self.db.query(Role).options(
            selectinload(Role.role_permissions).selectinload(RolePermission.menu_item).selectinload(MenuItem.module)
        ).filter(
            and_(Role.id == role_id, Role.tenant_id == tenant_id)
        ).first()
        
        if not role:
            return None
            
        return RoleWithPermissions.model_validate(role)

    def create_role(self, tenant_id: UUID, role_data: RoleCreate, created_by: UUID) -> RoleWithPermissions:
        """Create a new role with permissions"""
        
        # Check if role name already exists
        existing_role = self.db.query(Role).filter(
            and_(Role.tenant_id == tenant_id, Role.name == role_data.name)
        ).first()
        
        if existing_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role '{role_data.name}' already exists"
            )
        
        # Validate menu items are available for tenant's plan
        available_menus = self.get_available_menus_for_tenant(tenant_id)
        available_menu_ids = [item.id for item in available_menus.menu_items]
        
        # Create role
        role = Role(
            tenant_id=tenant_id,
            name=role_data.name,
            description=role_data.description,
            is_system_role=False
        )
        self.db.add(role)
        self.db.flush()  # To get the role ID
        
        # Create permissions
        for perm_data in role_data.permissions:
            menu_item_id = UUID(perm_data["menu_item_id"])
            
            # Validate menu item is available for this tenant's plan
            if menu_item_id not in available_menu_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Menu item not available for your subscription plan"
                )
            
            permission = RolePermission(
                role_id=role.id,
                menu_item_id=menu_item_id,
                can_view=perm_data.get("can_view", False),
                can_create=perm_data.get("can_create", False),
                can_edit=perm_data.get("can_edit", False),
                can_delete=perm_data.get("can_delete", False),
                can_export=perm_data.get("can_export", False)
            )
            self.db.add(permission)
        
        self.db.commit()
        
        return self.get_role_by_id(role.id, tenant_id)

    def update_role(self, role_id: UUID, tenant_id: UUID, role_data: RoleUpdate, updated_by: UUID) -> RoleWithPermissions:
        """Update role and permissions"""
        
        role = self.db.query(Role).filter(
            and_(Role.id == role_id, Role.tenant_id == tenant_id)
        ).first()
        
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        if role.is_system_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify system roles"
            )
        
        # Update basic role info
        if role_data.name is not None:
            # Check name uniqueness
            existing_role = self.db.query(Role).filter(
                and_(
                    Role.tenant_id == tenant_id,
                    Role.name == role_data.name,
                    Role.id != role_id
                )
            ).first()
            
            if existing_role:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Role '{role_data.name}' already exists"
                )
            
            role.name = role_data.name
        
        if role_data.description is not None:
            role.description = role_data.description
        
        # Update permissions if provided
        if role_data.permissions is not None:
            # Get available menus for validation
            available_menus = self.get_available_menus_for_tenant(tenant_id)
            available_menu_ids = [item.id for item in available_menus.menu_items]
            
            # Delete existing permissions
            self.db.query(RolePermission).filter(
                RolePermission.role_id == role_id
            ).delete()
            
            # Create new permissions
            for perm_data in role_data.permissions:
                menu_item_id = UUID(perm_data["menu_item_id"])
                
                # Validate menu item is available
                if menu_item_id not in available_menu_ids:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Menu item not available for your subscription plan"
                    )
                
                permission = RolePermission(
                    role_id=role_id,
                    menu_item_id=menu_item_id,
                    can_view=perm_data.get("can_view", False),
                    can_create=perm_data.get("can_create", False),
                    can_edit=perm_data.get("can_edit", False),
                    can_delete=perm_data.get("can_delete", False),
                    can_export=perm_data.get("can_export", False)
                )
                self.db.add(permission)
        
        self.db.commit()
        
        return self.get_role_by_id(role_id, tenant_id)

    def delete_role(self, role_id: UUID, tenant_id: UUID, deleted_by: UUID) -> bool:
        """Delete a role"""
        
        role = self.db.query(Role).filter(
            and_(Role.id == role_id, Role.tenant_id == tenant_id)
        ).first()
        
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        if role.is_system_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete system roles"
            )
        
        # Check if role is assigned to any users
        users_with_role = self.db.query(UserTenant).filter(
            UserTenant.roles.contains([role.name])
        ).count()
        
        if users_with_role > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete role. It is assigned to {users_with_role} user(s)"
            )
        
        self.db.delete(role)
        self.db.commit()
        
        return True

    def get_subscription_plans(self) -> List[SubscriptionPlanSchema]:
        """Get all active subscription plans"""
        plans = self.db.query(SubscriptionPlan).filter(
            SubscriptionPlan.is_active == True
        ).order_by(SubscriptionPlan.sort_order).all()
        
        return [SubscriptionPlanSchema.model_validate(plan) for plan in plans]

    def get_user_permissions(self, user_id: UUID, tenant_id: UUID) -> Dict[str, Dict[str, bool]]:
        """Get effective permissions for a user based on their roles"""
        
        # Get user's roles in this tenant
        user_tenant = self.db.query(UserTenant).filter(
            and_(UserTenant.user_id == user_id, UserTenant.tenant_id == tenant_id)
        ).first()
        
        if not user_tenant or not user_tenant.roles:
            return {}
        
        # Get all permissions for user's roles
        permissions_query = self.db.query(RolePermission).join(
            Role, RolePermission.role_id == Role.id
        ).join(
            MenuItem, RolePermission.menu_item_id == MenuItem.id
        ).filter(
            and_(
                Role.tenant_id == tenant_id,
                Role.name.in_(user_tenant.roles)
            )
        )
        
        # Aggregate permissions (OR operation - if any role grants permission, user has it)
        user_permissions = {}
        for perm in permissions_query:
            key = perm.menu_item.permission_key
            
            if key not in user_permissions:
                user_permissions[key] = {
                    'can_view': False,
                    'can_create': False,
                    'can_edit': False,
                    'can_delete': False,
                    'can_export': False
                }
            
            # OR operation for permissions
            user_permissions[key]['can_view'] = user_permissions[key]['can_view'] or perm.can_view
            user_permissions[key]['can_create'] = user_permissions[key]['can_create'] or perm.can_create
            user_permissions[key]['can_edit'] = user_permissions[key]['can_edit'] or perm.can_edit
            user_permissions[key]['can_delete'] = user_permissions[key]['can_delete'] or perm.can_delete
            user_permissions[key]['can_export'] = user_permissions[key]['can_export'] or perm.can_export
        
        return user_permissions

    def get_all_modules(self) -> List[ModuleSchema]:
        """Get all active modules"""
        modules = self.db.query(Module).filter(
            Module.is_active == True
        ).order_by(Module.sort_order).all()
        
        return [ModuleSchema.model_validate(module) for module in modules]

    def get_all_menu_items(self) -> List[MenuItemWithModule]:
        """Get all active menu items with their modules"""
        menu_items = self.db.query(MenuItem).options(
            selectinload(MenuItem.module)
        ).filter(
            MenuItem.is_active == True
        ).order_by(MenuItem.sort_order).all()
        
        return [MenuItemWithModule.model_validate(item) for item in menu_items]