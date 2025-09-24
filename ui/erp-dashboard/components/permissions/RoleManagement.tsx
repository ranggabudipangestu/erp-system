'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { permissionService } from '@/lib/api/permissions';
import { Role, AvailableMenusResponse, RolePermission } from '@/types/permissions';

interface RoleManagementProps {}

const RoleManagement: React.FC<RoleManagementProps> = () => {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableMenus, setAvailableMenus] = useState<AvailableMenusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rolesData, menusData] = await Promise.all([
        permissionService.getRoles(),
        permissionService.getAvailableMenus(),
      ]);

      setRoles(rolesData);
      setAvailableMenus(menusData);
      setError('');
    } catch (err) {
      setError('Failed to load roles and permissions');
      console.error('Error loading role management data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = () => {
    router.push('/user-management/roles/create');
  };

  const handleEditRole = (roleId: string) => {
    router.push(`/user-management/roles/${roleId}/edit`);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      await permissionService.deleteRole(roleId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete role:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  const getPermissionSummary = (permissions: RolePermission[]) => {
    const totalMenus = availableMenus?.menu_items.length ?? 0;
    const viewableMenus = permissions.filter((p) => p.can_view).length;
    const editableMenus = permissions.filter((p) => p.can_create || p.can_edit || p.can_delete || p.can_export).length;

    return {
      viewable: viewableMenus,
      editable: editableMenus,
      total: totalMenus,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Role Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage user roles and permissions for your organization</p>
        </div>

        <button
          onClick={handleCreateRole}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">{error}</div>
      )}

      {availableMenus && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">{availableMenus.plan_name}</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">{roles.length} roles configured</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {availableMenus.menu_items.length} menu items available
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Current plan: {availableMenus.current_plan}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => {
          const summary = getPermissionSummary(role.permissions || []);
          const isSystemRole = (role as any).is_system ?? (role as any).is_system_role ?? false;

          return (
            <div key={role.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow dark:bg-gray-900 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{role.name}</h3>
                    {isSystemRole && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        System
                      </span>
                    )}
                  </div>
                  {role.description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{role.description}</p>}
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {summary.viewable}/{summary.total} menus • {summary.editable} with edit access
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEditRole(role.id)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors dark:hover:bg-indigo-500/10"
                    title="Edit role"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {!isSystemRole && (
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors dark:hover:bg-red-500/10"
                      title="Delete role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Key Permissions:</div>
                <div className="flex flex-wrap gap-1">
                  {(role.permissions || [])
                    .filter((p) => p.can_view)
                    .slice(0, 3)
                    .map((permission) => (
                      <span
                        key={permission.menu_item_id}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300"
                      >
                        {permission.menu_item?.name || 'Menu Item'}
                      </span>
                    ))}
                  {(role.permissions || []).filter((p) => p.can_view).length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      +{(role.permissions || []).filter((p) => p.can_view).length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {roles.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No roles</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating your first role.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagement;
