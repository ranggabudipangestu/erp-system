'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { permissionService } from '@/lib/api/permissions';
import { AuthService } from '@/lib/auth';
import {
  AvailableMenusResponse,
  MenuItem,
  RolePermission,
  hasPermission as checkPermission
} from '@/types/permissions';

interface PermissionContextValue {
  permissions: Record<string, Record<string, boolean>>;
  availableMenus: AvailableMenusResponse | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: (permissionKey: string, action?: string) => boolean;
  canView: (permissionKey: string) => boolean;
  canCreate: (permissionKey: string) => boolean;
  canEdit: (permissionKey: string) => boolean;
  canDelete: (permissionKey: string) => boolean;
  canExport: (permissionKey: string) => boolean;
  getAvailableMenuItems: () => MenuItem[];
  refresh: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [availableMenus, setAvailableMenus] = useState<AvailableMenusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!AuthService.isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      const [userPermissions, menuData] = await Promise.all([
        permissionService.getUserPermissions(),
        permissionService.getAvailableMenus()
      ]);

      setPermissions(userPermissions);
      setAvailableMenus(menuData);
    } catch (err) {
      console.error('Failed to load permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const hasPermissionCheck = (permissionKey: string, action: string = 'can_view'): boolean => {
    // For development: allow viewing basic menu items when no permissions are loaded
    if (Object.keys(permissions).length === 0 && action === 'can_view') {
      const allowedPermissions = ['products.view', 'sales.invoices.view'];
      return allowedPermissions.includes(permissionKey);
    }
    return permissions[permissionKey]?.[action] || false;
  };

  const canView = (permissionKey: string): boolean => hasPermissionCheck(permissionKey, 'can_view');
  const canCreate = (permissionKey: string): boolean => hasPermissionCheck(permissionKey, 'can_create');
  const canEdit = (permissionKey: string): boolean => hasPermissionCheck(permissionKey, 'can_edit');
  const canDelete = (permissionKey: string): boolean => hasPermissionCheck(permissionKey, 'can_delete');
  const canExport = (permissionKey: string): boolean => hasPermissionCheck(permissionKey, 'can_export');

  const getAvailableMenuItems = (): MenuItem[] => {
    if (!availableMenus) {
      // Create mock availableMenus for development
      const mockMenus = {
        plan_name: 'Development Plan',
        current_plan: 'dev',
        modules: [
          {
            id: '1',
            code: 'master_data',
            name: 'Master Data',
            icon: 'database',
            sort_order: 1,
            description: 'Master data management',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            code: 'sales',
            name: 'Sales',
            icon: 'shopping-cart',
            sort_order: 2,
            description: 'Sales management',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ],
        menu_items: [
          {
            id: '1',
            code: 'products',
            name: 'Products',
            route: '/master-data/products',
            permission_key: 'products.view',
            icon: 'package',
            description: 'Manage products',
            sort_order: 1,
            module_id: '1',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            code: 'sales_invoices',
            name: 'Sales Invoices',
            route: '/sales/invoices',
            permission_key: 'sales.invoices.view',
            icon: 'receipt',
            description: 'Sales invoices',
            sort_order: 2,
            module_id: '2',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ]
      };

      // Set the mock data temporarily
      setAvailableMenus(mockMenus);

      return mockMenus.menu_items.filter(item =>
        hasPermissionCheck(item.permission_key, 'can_view')
      );
    }

    return availableMenus.menu_items.filter(item =>
      hasPermissionCheck(item.permission_key, 'can_view')
    );
  };

  const value: PermissionContextValue = {
    permissions,
    availableMenus,
    isLoading,
    error,
    hasPermission: hasPermissionCheck,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    getAvailableMenuItems,
    refresh: loadPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = (): PermissionContextValue => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// Permission-based component wrapper
interface PermissionGateProps {
  permission: string;
  action?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  action = 'can_view',
  children,
  fallback = null
}) => {
  const { hasPermission } = usePermissions();
  
  if (hasPermission(permission, action)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};