// Permission Management Types - Updated to match backend spec

// Core Types
export interface Module {
  id: string;
  code: string;
  name: string;
  description?: string;
  parent_id?: string;
  sort_order: number;
  icon?: string;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  module_id: string;
  code: string;
  name: string;
  description?: string;
  route?: string;
  permission_key: string;
  sort_order: number;
  icon?: string;
  is_active: boolean;
  created_at: string;
  module?: Module; // When populated
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  is_active: boolean;
  sort_order: number;
}

export interface PlanMenuItem {
  id: string;
  plan_id: string;
  menu_item_id: string;
  is_included: boolean;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  menu_item_id: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  created_at: string;
  updated_at?: string;
  menu_item?: MenuItem; // When populated
}

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_system: boolean;
  created_at: string;
  updated_at?: string;
  permissions?: RolePermission[];
}

// API Response Types
export interface AvailableMenusResponse {
  modules: Module[];
  menu_items: MenuItem[];
  current_plan: string;
  plan_name: string;
}

export interface NavigationMenuItem {
  id: string;
  code: string;
  name: string;
  route?: string;
  icon: string;
  permission_key: string;
  sort_order: number;
}

export interface NavigationModule {
  id: string;
  code: string;
  name: string;
  icon: string;
  sort_order: number;
  items: NavigationMenuItem[];
}

export interface NavigationResponse {
  modules: NavigationModule[];
}

// Form Types
export interface RoleCreateData {
  name: string;
  description?: string;
  permissions: {
    menu_item_id: string;
    can_view?: boolean;
    can_create?: boolean;
    can_edit?: boolean;
    can_delete?: boolean;
    can_export?: boolean;
  }[];
}

export interface RoleUpdateData {
  name?: string;
  description?: string;
  permissions?: {
    menu_item_id: string;
    can_view?: boolean;
    can_create?: boolean;
    can_edit?: boolean;
    can_delete?: boolean;
    can_export?: boolean;
  }[];
}

// Legacy types for backward compatibility
export interface Permission {
  menuId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  isActive: boolean;
}

export type SubscriptionPlanType = 'basic' | 'professional' | 'enterprise';

export interface SubscriptionPlanConfig {
  plan: SubscriptionPlanType;
  allowedMenus: string[];
  maxRoles: number;
  maxUsersPerRole: number;
}

// Utility functions
export const groupMenusByModule = (menus: MenuItem[], modules: Module[]) => {
  const grouped: Record<string, { module: Module; items: MenuItem[] }> = {};
  
  menus.forEach(menu => {
    const module = modules.find(m => m.id === menu.module_id);
    if (!module) return;
    
    if (!grouped[module.id]) {
      grouped[module.id] = {
        module,
        items: []
      };
    }
    
    grouped[module.id].items.push(menu);
  });
  
  // Sort modules and their items
  Object.values(grouped).forEach(group => {
    group.items.sort((a, b) => a.sort_order - b.sort_order);
  });
  
  return grouped;
};

export const getPermissionState = (
  permissions: RolePermission[], 
  menuItemId: string
): RolePermission => {
  const existing = permissions.find(p => p.menu_item_id === menuItemId);
  return existing || {
    id: '',
    role_id: '',
    menu_item_id: menuItemId,
    can_view: false,
    can_create: false,
    can_edit: false,
    can_delete: false,
    can_export: false,
    created_at: ''
  };
};

export const hasPermission = (
  permissions: Record<string, RolePermission>, 
  permissionKey: string, 
  action: keyof Pick<RolePermission, 'can_view' | 'can_create' | 'can_edit' | 'can_delete' | 'can_export'> = 'can_view'
): boolean => {
  return permissions[permissionKey]?.[action] || false;
};

// Legacy helper functions for backward compatibility  
export const getMenusByCategory = (_menuIds: string[]) => {
  // This will be replaced by API calls in the new implementation
  return {};
};

export const getMenuById = (_menuId: string) => {
  // This will be replaced by API calls in the new implementation
  return undefined;
};
