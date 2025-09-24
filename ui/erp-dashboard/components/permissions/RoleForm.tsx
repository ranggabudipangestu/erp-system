'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { permissionService } from '@/lib/api/permissions';
import {
  Role,
  RoleCreateData,
  RoleUpdateData,
  RolePermission,
  NavigationModule,
} from '@/types/permissions';
import RolePermissionSelector, { PermissionMap } from './RolePermissionSelector';

interface RoleFormProps {
  mode: 'create' | 'edit';
  roleId?: string;
}

const buildPermissionMap = (permissions?: RolePermission[]): PermissionMap => {
  if (!permissions) {
    return {};
  }

  return permissions.reduce<PermissionMap>((acc, permission) => {
    acc[permission.menu_item_id] = {
      menu_item_id: permission.menu_item_id,
      can_view: permission.can_view ?? false,
      can_create: permission.can_create ?? false,
      can_edit: permission.can_edit ?? false,
      can_delete: permission.can_delete ?? false,
      can_export: permission.can_export ?? false,
    };
    return acc;
  }, {});
};

const serializePermissions = (permissions: PermissionMap) =>
  Object.values(permissions)
    .filter(
      (selection) => selection.can_view || selection.can_create || selection.can_edit || selection.can_delete || selection.can_export,
    )
    .map(({ menu_item_id, can_view, can_create, can_edit, can_delete, can_export }) => ({
      menu_item_id,
      can_view,
      can_create,
      can_edit,
      can_delete,
      can_export,
    }));

const RoleForm: React.FC<RoleFormProps> = ({ mode, roleId }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navigationModules, setNavigationModules] = useState<NavigationModule[]>([]);
  const [role, setRole] = useState<Role | null>(null);

  const [formState, setFormState] = useState({
    name: '',
    description: '',
  });
  const [permissionMap, setPermissionMap] = useState<PermissionMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const navPromise = permissionService.getNavigation();
        let rolePromise: Promise<Role | null> = Promise.resolve(null);

        if (mode === 'edit' && roleId) {
          rolePromise = permissionService.getRole(roleId);
        }

        const [navResponse, roleData] = await Promise.all([navPromise, rolePromise]);

        setNavigationModules(navResponse.modules);

        if (roleData) {
          setRole(roleData);
          setFormState({
            name: roleData.name,
            description: roleData.description || '',
          });
          setPermissionMap(buildPermissionMap(roleData.permissions));
        } else {
          setRole(null);
          setFormState({ name: '', description: '' });
          setPermissionMap({});
        }
      } catch (err) {
        console.error('Failed to load role data:', err);
        setError('Failed to load role data');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [mode, roleId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        permissions: serializePermissions(permissionMap),
      };

      if (mode === 'create') {
        await permissionService.createRole(payload as RoleCreateData);
      } else if (mode === 'edit' && roleId) {
        await permissionService.updateRole(roleId, payload as RoleUpdateData);
      }

      router.push('/user-management/roles');
    } catch (err) {
      console.error('Failed to save role:', err);
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/user-management/roles"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Roles
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Create Role' : `Edit Role`}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Define a role with specific permissions for your team members.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-red-600 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:bg-gray-900"
                placeholder="Enter role name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:bg-gray-900"
                placeholder="Optional description"
              />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Permissions</h2>
            {navigationModules.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No navigable resources are available for this tenant.
              </div>
            ) : (
              <RolePermissionSelector
                modules={navigationModules}
                value={permissionMap}
                onChange={setPermissionMap}
                disabled={isSubmitting}
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/user-management/roles')}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formState.name.trim()}
              className="inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Role' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleForm;
