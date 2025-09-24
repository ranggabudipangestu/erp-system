from typing import List, Dict, Optional, Any
from uuid import UUID, uuid4
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_
from fastapi import HTTPException, status

from app.modules.permissions.models import (
    Module, MenuItem,
    SubscriptionPlan, PlanMenuItem
)
from app.modules.auth.models import Role, Tenant, UserTenant
from app.modules.permissions.schemas import (
    RoleCreate,
    RoleUpdate,
    RoleWithPermissions,
    AvailableMenusResponse,
    ModuleSchema,
    MenuItemWithModule,
    RoleSchema,
    SubscriptionPlanSchema,
    NavigationModule,
    NavigationMenuItem,
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

    def get_navigation_for_user(self, tenant_id: UUID, allowed_permissions: set[str]) -> List[NavigationModule]:
        """Build navigation tree filtered by the user's permissions"""

        available = self.get_available_menus_for_tenant(tenant_id)

        allowed_items = [
            item for item in available.menu_items if item.permission_key in allowed_permissions
        ]

        items_by_module: Dict[UUID, List[MenuItemWithModule]] = {}
        for item in allowed_items:
            items_by_module.setdefault(item.module_id, []).append(item)

        navigation: List[NavigationModule] = []
        for module in sorted(available.modules, key=lambda m: m.sort_order):
            module_items = items_by_module.get(module.id)
            if not module_items:
                continue

            sorted_items = sorted(module_items, key=lambda i: i.sort_order)
            navigation.append(
                NavigationModule(
                    id=module.id,
                    code=module.code,
                    name=module.name,
                    icon=module.icon,
                    sort_order=module.sort_order,
                    items=[
                        NavigationMenuItem(
                            id=item.id,
                            code=item.code,
                            name=item.name,
                            route=item.route,
                            icon=item.icon,
                            permission_key=item.permission_key,
                            sort_order=item.sort_order,
                        )
                        for item in sorted_items
                        if item.route  # only include navigable entries
                    ],
                )
            )

        # remove modules that lost all routable items after filtering
        navigation = [module for module in navigation if module.items]
        return navigation

    # ------------------------------------------------------------------
    # Internal helpers

    @staticmethod
    @staticmethod
    def _replace_action(view_key: str, action: str) -> str:
        if action == 'view':
            return view_key
        if view_key.endswith('.view'):
            return f"{view_key.rsplit('.', 1)[0]}.{action}"
        return f"{view_key}.{action}"

    @staticmethod
    def _parse_permission_tokens(tokens: Optional[List[str]]) -> Dict[str, Dict[str, bool]]:
        mapping: Dict[str, Dict[str, bool]] = {}
        if not tokens:
            return mapping

        actions = {'view', 'create', 'edit', 'delete', 'export'}

        for token in tokens:
            if not token:
                continue

            parts = token.split('.')
            if not parts:
                continue

            action = parts[-1].lower()
            if action in actions:
                base_parts = parts[:-1]
                if action != 'view':
                    base_parts = base_parts + ['view']
                base_key = '.'.join(base_parts) if base_parts else token
            else:
                action = 'view'
                base_key = token

            base_key = base_key.strip()
            if not base_key:
                continue

            flags = mapping.setdefault(
                base_key,
                {
                    "can_view": False,
                    "can_create": False,
                    "can_edit": False,
                    "can_delete": False,
                    "can_export": False,
                },
            )

            if action in ("view", "read", "can_view", ""):
                flags["can_view"] = True
            elif action in ("create", "can_create"):
                flags["can_create"] = True
                flags["can_view"] = True
            elif action in ("edit", "update", "can_edit"):
                flags["can_edit"] = True
                flags["can_view"] = True
            elif action in ("delete", "remove", "can_delete"):
                flags["can_delete"] = True
                flags["can_view"] = True
            elif action in ("export", "can_export"):
                flags["can_export"] = True
                flags["can_view"] = True

        return mapping

    def _build_role_permission_payload(self, role: Role) -> List[Dict[str, Any]]:
        permission_flags = self._parse_permission_tokens(role.permissions)
        if not permission_flags:
            return []

        menu_items = self.db.query(MenuItem).filter(
            MenuItem.permission_key.in_(permission_flags.keys())
        ).all()
        menu_map = {item.permission_key: item for item in menu_items}

        role_permissions: List[Dict[str, Any]] = []
        for permission_key, flags in permission_flags.items():
            menu_item = menu_map.get(permission_key)
            if not menu_item:
                continue

            role_permissions.append(
                {
                    "id": str(role.id),
                    "role_id": role.id,
                    "menu_item_id": menu_item.id,
                    "can_view": flags["can_view"],
                    "can_create": flags["can_create"],
                    "can_edit": flags["can_edit"],
                    "can_delete": flags["can_delete"],
                    "can_export": flags["can_export"],
                    "created_at": role.created_at,
                    "updated_at": role.updated_at,
                    "menu_item": menu_item,
                }
            )

        return role_permissions

    def get_roles_for_tenant(self, tenant_id: UUID) -> List[RoleWithPermissions]:
        """Get all roles for a tenant with their permissions"""

        roles = self.db.query(Role).filter(Role.tenant_id == tenant_id).order_by(Role.name).all()

        result = []
        for role in roles:
            role_permissions = self._build_role_permission_payload(role)
            role_data = {
                "id": role.id,
                "tenant_id": role.tenant_id,
                "name": role.name,
                "description": role.description,
                "is_system_role": role.is_system_role,
                "created_at": role.created_at,
                "updated_at": role.updated_at,
                "permissions": role_permissions,
            }

            result.append(RoleWithPermissions.model_validate(role_data))

        return result

    def get_role_by_id(self, role_id: UUID, tenant_id: UUID) -> Optional[RoleWithPermissions]:
        """Get a specific role with permissions"""

        role = self.db.query(Role).filter(
            and_(Role.id == role_id, Role.tenant_id == tenant_id)
        ).first()

        if not role:
            return None

        role_permissions = self._build_role_permission_payload(role)

        # Create RoleWithPermissions object
        role_data = {
            "id": role.id,
            "tenant_id": role.tenant_id,
            "name": role.name,
            "description": role.description,
            "is_system_role": role.is_system_role,
            "created_at": role.created_at,
            "updated_at": role.updated_at,
            "permissions": role_permissions
        }

        return RoleWithPermissions.model_validate(role_data)

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
        
        available_menus = self.get_available_menus_for_tenant(tenant_id)
        available_menu_ids = [item.id for item in available_menus.menu_items]
        permission_map = {UUID(str(item.id)): item.permission_key for item in available_menus.menu_items}

        permission_tokens: set[str] = set()

        role = Role(
            id=uuid4(),
            tenant_id=tenant_id,
            name=role_data.name,
            description=role_data.description,
            permissions=[],
            is_system_role=False,
        )
        self.db.add(role)
        self.db.flush()

        for perm_data in role_data.permissions:
            menu_item_id = UUID(perm_data["menu_item_id"])

            if menu_item_id not in available_menu_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Menu item not available for your subscription plan",
                )

            permission_key = permission_map.get(menu_item_id)
            if not permission_key:
                continue

            if perm_data.get("can_view"):
                permission_tokens.add(permission_key)
            if perm_data.get("can_create"):
                permission_tokens.add(self._replace_action(permission_key, 'create'))
            if perm_data.get("can_edit"):
                permission_tokens.add(self._replace_action(permission_key, 'edit'))
            if perm_data.get("can_delete"):
                permission_tokens.add(self._replace_action(permission_key, 'delete'))
            if perm_data.get("can_export"):
                permission_tokens.add(self._replace_action(permission_key, 'export'))

        role.permissions = list(permission_tokens)
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
            available_menus = self.get_available_menus_for_tenant(tenant_id)
            available_menu_ids = [item.id for item in available_menus.menu_items]
            permission_map = {UUID(str(item.id)): item.permission_key for item in available_menus.menu_items}
            permission_tokens: set[str] = set()

            for perm_data in role_data.permissions:
                menu_item_id = UUID(perm_data["menu_item_id"])

                if menu_item_id not in available_menu_ids:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Menu item not available for your subscription plan",
                    )

                permission_key = permission_map.get(menu_item_id)
                if not permission_key:
                    continue

                if perm_data.get("can_view"):
                    permission_tokens.add(permission_key)
                if perm_data.get("can_create"):
                    permission_tokens.add(self._replace_action(permission_key, 'create'))
                if perm_data.get("can_edit"):
                    permission_tokens.add(self._replace_action(permission_key, 'edit'))
                if perm_data.get("can_delete"):
                    permission_tokens.add(self._replace_action(permission_key, 'delete'))
                if perm_data.get("can_export"):
                    permission_tokens.add(self._replace_action(permission_key, 'export'))

            role.permissions = list(permission_tokens)

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
        
        roles = self.db.query(Role).filter(
            and_(
                Role.tenant_id == tenant_id,
                Role.name.in_(user_tenant.roles)
            )
        ).all()

        aggregated: Dict[str, Dict[str, bool]] = {}
        for role in roles:
            decoded = self._parse_permission_tokens(role.permissions)
            for permission_key, flags in decoded.items():
                entry = aggregated.setdefault(
                    permission_key,
                    {
                        'can_view': False,
                        'can_create': False,
                        'can_edit': False,
                        'can_delete': False,
                        'can_export': False,
                    },
                )
                entry['can_view'] = entry['can_view'] or flags['can_view']
                entry['can_create'] = entry['can_create'] or flags['can_create']
                entry['can_edit'] = entry['can_edit'] or flags['can_edit']
                entry['can_delete'] = entry['can_delete'] or flags['can_delete']
                entry['can_export'] = entry['can_export'] or flags['can_export']

        return aggregated

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
