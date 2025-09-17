'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  RolePermission,
  AvailableMenusResponse,
  groupMenusByModule,
  getPermissionState
} from '@/types/permissions';

interface PermissionMatrixProps {
  permissions: RolePermission[];
  onPermissionChange: (permissions: RolePermission[]) => void;
  availableMenus: AvailableMenusResponse | null;
  disabled?: boolean;
}

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  permissions,
  onPermissionChange,
  availableMenus,
  disabled = false
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  if (!availableMenus) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Loading permissions...</div>
      </div>
    );
  }

  const menusByModule = groupMenusByModule(availableMenus.menu_items, availableMenus.modules);

  const getPermission = (menuItemId: string): RolePermission => {
    return getPermissionState(permissions, menuItemId);
  };

  const updatePermission = (menuItemId: string, updates: Partial<RolePermission>) => {
    const updatedPermissions = [...permissions];
    const existingIndex = updatedPermissions.findIndex(p => p.menu_item_id === menuItemId);
    
    if (existingIndex >= 0) {
      updatedPermissions[existingIndex] = { ...updatedPermissions[existingIndex], ...updates };
    } else {
      updatedPermissions.push({
        id: '',
        role_id: '',
        menu_item_id: menuItemId,
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_export: false,
        created_at: '',
        ...updates
      });
    }

    // Remove permissions that have all false values
    const filteredPermissions = updatedPermissions.filter(p => 
      p.can_view || p.can_create || p.can_edit || p.can_delete || p.can_export
    );

    onPermissionChange(filteredPermissions);
  };

  const handlePermissionToggle = (
    menuItemId: string, 
    permissionType: keyof Pick<RolePermission, 'can_view' | 'can_create' | 'can_edit' | 'can_delete' | 'can_export'>
  ) => {
    const currentPermission = getPermission(menuItemId);
    const newValue = !currentPermission[permissionType];
    
    const updates: Partial<RolePermission> = { [permissionType]: newValue };
    
    // If enabling create/edit/delete/export, automatically enable view
    if ((permissionType === 'can_create' || permissionType === 'can_edit' || 
         permissionType === 'can_delete' || permissionType === 'can_export') && newValue) {
      updates.can_view = true;
    }
    
    // If disabling view, disable all other permissions
    if (permissionType === 'can_view' && !newValue) {
      updates.can_create = false;
      updates.can_edit = false;
      updates.can_delete = false;
      updates.can_export = false;
    }
    
    updatePermission(menuItemId, updates);
  };

  const toggleModulePermissions = (
    moduleId: string, 
    permissionType: keyof Pick<RolePermission, 'can_view' | 'can_create' | 'can_edit' | 'can_delete' | 'can_export'>
  ) => {
    const moduleGroup = menusByModule[moduleId];
    if (!moduleGroup) return;
    
    const allEnabled = moduleGroup.items.every(item => getPermission(item.id)[permissionType]);
    
    moduleGroup.items.forEach(item => {
      const updates: Partial<RolePermission> = { [permissionType]: !allEnabled };
      
      // Same logic as individual toggle
      if ((permissionType === 'can_create' || permissionType === 'can_edit' || 
           permissionType === 'can_delete' || permissionType === 'can_export') && !allEnabled) {
        updates.can_view = true;
      }
      
      if (permissionType === 'can_view' && allEnabled) {
        updates.can_create = false;
        updates.can_edit = false;
        updates.can_delete = false;
        updates.can_export = false;
      }
      
      updatePermission(item.id, updates);
    });
  };

  const isModulePermissionEnabled = (
    moduleId: string, 
    permissionType: keyof Pick<RolePermission, 'can_view' | 'can_create' | 'can_edit' | 'can_delete' | 'can_export'>
  ) => {
    const moduleGroup = menusByModule[moduleId];
    if (!moduleGroup) return false;
    
    return moduleGroup.items.length > 0 && moduleGroup.items.every(item => getPermission(item.id)[permissionType]);
  };

  const isModulePermissionPartial = (
    moduleId: string, 
    permissionType: keyof Pick<RolePermission, 'can_view' | 'can_create' | 'can_edit' | 'can_delete' | 'can_export'>
  ) => {
    const moduleGroup = menusByModule[moduleId];
    if (!moduleGroup) return false;
    
    const enabledCount = moduleGroup.items.filter(item => getPermission(item.id)[permissionType]).length;
    return enabledCount > 0 && enabledCount < moduleGroup.items.length;
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const PermissionCheckbox: React.FC<{
    checked: boolean;
    indeterminate?: boolean;
    onChange: () => void;
    disabled?: boolean;
    size?: 'sm' | 'md';
  }> = ({ checked, indeterminate = false, onChange, disabled: checkboxDisabled = false, size = 'md' }) => {
    const sizeClasses = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    
    return (
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled || checkboxDisabled}
          className={`${sizeClasses} rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {indeterminate && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-0.5 bg-blue-600 rounded"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Subscription Plan Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              {availableMenus.plan_name}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {availableMenus.menu_items.length} menu items available • Current plan: {availableMenus.current_plan}
            </p>
          </div>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="space-y-4">
        {Object.values(menusByModule)
          .sort((a, b) => a.module.sort_order - b.module.sort_order)
          .map(({ module, items }) => {
            const isExpanded = expandedModules.has(module.id);
            
            return (
              <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                {/* Module Header */}
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleModule(module.id)}
                      className="flex items-center text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-gray-100">{module.name}</span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        ({items.length} items)
                      </span>
                    </button>
                    
                    <div className="flex items-center space-x-6 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <span>View:</span>
                        <PermissionCheckbox
                          checked={isModulePermissionEnabled(module.id, 'can_view')}
                          indeterminate={isModulePermissionPartial(module.id, 'can_view')}
                          onChange={() => toggleModulePermissions(module.id, 'can_view')}
                          disabled={disabled}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>Create:</span>
                        <PermissionCheckbox
                          checked={isModulePermissionEnabled(module.id, 'can_create')}
                          indeterminate={isModulePermissionPartial(module.id, 'can_create')}
                          onChange={() => toggleModulePermissions(module.id, 'can_create')}
                          disabled={disabled}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>Edit:</span>
                        <PermissionCheckbox
                          checked={isModulePermissionEnabled(module.id, 'can_edit')}
                          indeterminate={isModulePermissionPartial(module.id, 'can_edit')}
                          onChange={() => toggleModulePermissions(module.id, 'can_edit')}
                          disabled={disabled}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>Delete:</span>
                        <PermissionCheckbox
                          checked={isModulePermissionEnabled(module.id, 'can_delete')}
                          indeterminate={isModulePermissionPartial(module.id, 'can_delete')}
                          onChange={() => toggleModulePermissions(module.id, 'can_delete')}
                          disabled={disabled}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>Export:</span>
                        <PermissionCheckbox
                          checked={isModulePermissionEnabled(module.id, 'can_export')}
                          indeterminate={isModulePermissionPartial(module.id, 'can_export')}
                          onChange={() => toggleModulePermissions(module.id, 'can_export')}
                          disabled={disabled}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Module Items */}
                {isExpanded && (
                  <div className="p-4">
                    <div className="space-y-3">
                      {items.map((item) => {
                        const permission = getPermission(item.id);
                        
                        return (
                          <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {item.name}
                              </div>
                              {item.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {item.description}
                                </div>
                              )}
                              {item.route && (
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  Route: {item.route}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-6">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">View:</span>
                                <PermissionCheckbox
                                  checked={permission.can_view}
                                  onChange={() => handlePermissionToggle(item.id, 'can_view')}
                                  disabled={disabled}
                                  size="sm"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Create:</span>
                                <PermissionCheckbox
                                  checked={permission.can_create}
                                  onChange={() => handlePermissionToggle(item.id, 'can_create')}
                                  disabled={disabled}
                                  size="sm"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Edit:</span>
                                <PermissionCheckbox
                                  checked={permission.can_edit}
                                  onChange={() => handlePermissionToggle(item.id, 'can_edit')}
                                  disabled={disabled}
                                  size="sm"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Delete:</span>
                                <PermissionCheckbox
                                  checked={permission.can_delete}
                                  onChange={() => handlePermissionToggle(item.id, 'can_delete')}
                                  disabled={disabled}
                                  size="sm"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Export:</span>
                                <PermissionCheckbox
                                  checked={permission.can_export}
                                  onChange={() => handlePermissionToggle(item.id, 'can_export')}
                                  disabled={disabled}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {Object.keys(menusByModule).length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No permissions available</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your current subscription plan doesn't include access to any modules.
          </p>
        </div>
      )}
    </div>
  );
};

export default PermissionMatrix;