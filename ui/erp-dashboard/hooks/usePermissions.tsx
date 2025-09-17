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
    return permissions[permissionKey]?.[action] || false;
  };

  const canView = (permissionKey: string): boolean => hasPermissionCheck(permissionKey, 'can_view');
  const canCreate = (permissionKey: string): boolean => hasPermissionCheck(permissionKey, 'can_create');
  const canEdit = (permissionKey: string): boolean => hasPermissionCheck(permissionKey, 'can_edit');
  const canDelete = (permissionKey: string): boolean => hasPermissionCheck(permissionKey, 'can_delete');
  const canExport = (permissionKey: string): boolean => hasPermissionCheck(permissionKey, 'can_export');

  const getAvailableMenuItems = (): MenuItem[] => {
    if (!availableMenus) return [];
    
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