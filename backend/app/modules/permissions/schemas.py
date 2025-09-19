from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime


# Base Schemas
class ModuleBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    sort_order: int = 0


class ModuleSchema(ModuleBase):
    id: UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class MenuItemBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    route: Optional[str] = None
    permission_key: str = Field(..., max_length=100)
    icon: Optional[str] = None
    sort_order: int = 0


class MenuItemSchema(MenuItemBase):
    id: UUID
    module_id: UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class MenuItemWithModule(MenuItemSchema):
    module: ModuleSchema


class RolePermissionBase(BaseModel):
    can_view: bool = False
    can_create: bool = False
    can_edit: bool = False
    can_delete: bool = False
    can_export: bool = False


class RolePermissionSchema(RolePermissionBase):
    id: UUID
    role_id: UUID
    menu_item_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class RolePermissionWithMenuItem(RolePermissionSchema):
    menu_item: MenuItemSchema


class RoleBase(BaseModel):
    name: str = Field(..., max_length=50)
    description: Optional[str] = None


class RoleCreate(RoleBase):
    permissions: List[Dict[str, Any]] = []  # [{"menu_item_id": "uuid", "can_view": true, ...}]


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    permissions: Optional[List[Dict[str, Any]]] = None


class RoleSchema(RoleBase):
    id: UUID
    tenant_id: Optional[UUID]
    is_system_role: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class RoleWithPermissions(RoleSchema):
    permissions: List[RolePermissionWithMenuItem] = []


class SubscriptionPlanSchema(BaseModel):
    id: UUID
    code: str
    name: str
    description: Optional[str] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    is_active: bool
    sort_order: int
    
    class Config:
        from_attributes = True


# Response Schemas
class AvailableMenusResponse(BaseModel):
    modules: List[ModuleSchema] = []
    menu_items: List[MenuItemWithModule] = []
    current_plan: str
    plan_name: str


class UserPermissionsResponse(BaseModel):
    permissions: Dict[str, Dict[str, bool]] = {}


class NavigationMenuItem(BaseModel):
    id: UUID
    code: str
    name: str
    route: Optional[str] = None
    icon: Optional[str] = None
    permission_key: str
    sort_order: int = 0


class NavigationModule(BaseModel):
    id: UUID
    code: str
    name: str
    icon: Optional[str] = None
    sort_order: int = 0
    items: List[NavigationMenuItem] = []


class NavigationResponse(BaseModel):
    modules: List[NavigationModule]


# Request/Response for bulk operations
class BulkRolePermissionUpdate(BaseModel):
    role_id: UUID
    permissions: List[Dict[str, Any]]


class PermissionSummary(BaseModel):
    total_roles: int
    total_permissions: int
    plan_limitations: Dict[str, Any]
