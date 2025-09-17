'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { permissionService } from '@/lib/api/permissions';
import {
  Role,
  RoleCreateData,
  RoleUpdateData,
  AvailableMenusResponse,
  RolePermission
} from '@/types/permissions';
import PermissionMatrix from './PermissionMatrix';

interface RoleManagementProps {
  // No props needed - component manages its own state
}

const RoleManagement: React.FC<RoleManagementProps> = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableMenus, setAvailableMenus] = useState<AvailableMenusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rolesData, menusData] = await Promise.all([
        permissionService.getRoles(),
        permissionService.getAvailableMenus()
      ]);
      
      setRoles(rolesData);
      setAvailableMenus(menusData);
    } catch (error) {
      setError('Failed to load roles and permissions');
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditModalOpen(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      try {
        await permissionService.deleteRole(roleId);
        await loadData();
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to delete role');
      }
    }
  };

  const getPermissionSummary = (permissions: RolePermission[]) => {
    const totalMenus = availableMenus?.menu_items.length || 0;
    const viewableMenus = permissions.filter(p => p.can_view).length;
    const editableMenus = permissions.filter(p => p.can_edit || p.can_create || p.can_delete).length;
    
    return {
      viewable: viewableMenus,
      editable: editableMenus,
      total: totalMenus
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Role Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage user roles and permissions for your organization
          </p>
        </div>
        
        <button
          onClick={handleCreateRole}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Subscription Info */}
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
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                  {availableMenus.plan_name}
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {roles.length} roles configured
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {availableMenus.menu_items.length} menu items available
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Current plan: {availableMenus.current_plan}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => {
          const summary = getPermissionSummary(role.permissions || []);
          
          return (
            <div key={role.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                    {role.is_system && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        System
                      </span>
                    )}
                  </div>
                  
                  {role.description && (
                    <p className="mt-1 text-sm text-gray-600">{role.description}</p>
                  )}
                  
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">
                      {summary.viewable}/{summary.total} menus • {summary.editable} with edit access
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEditRole(role)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Edit role"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  {!role.is_system && (
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Permission Preview */}
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">Key Permissions:</div>
                <div className="flex flex-wrap gap-1">
                  {(role.permissions || [])
                    .filter(p => p.can_view)
                    .slice(0, 3)
                    .map(permission => (
                      <span 
                        key={permission.menu_item_id}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                      >
                        {permission.menu_item?.name || 'Menu Item'}
                      </span>
                    ))
                  }
                  {(role.permissions || []).filter(p => p.can_view).length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      +{(role.permissions || []).filter(p => p.can_view).length - 3} more
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No roles</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first role.
            </p>
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      {isCreateModalOpen && (
        <RoleModal
          mode="create"
          availableMenus={availableMenus}
          onSave={async (roleData) => {
            await permissionService.createRole(roleData as RoleCreateData);
            setIsCreateModalOpen(false);
            await loadData();
          }}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* Edit Role Modal */}
      {isEditModalOpen && selectedRole && (
        <RoleModal
          mode="edit"
          role={selectedRole}
          availableMenus={availableMenus}
          onSave={async (roleData) => {
            await permissionService.updateRole(selectedRole.id, roleData as RoleUpdateData);
            setIsEditModalOpen(false);
            setSelectedRole(null);
            await loadData();
          }}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedRole(null);
          }}
        />
      )}
    </div>
  );
};

// Role Modal Component
interface RoleModalProps {
  mode: 'create' | 'edit';
  role?: Role;
  availableMenus: AvailableMenusResponse | null;
  onSave: (roleData: RoleCreateData | RoleUpdateData) => Promise<void>;
  onCancel: () => void;
}

const RoleModal: React.FC<RoleModalProps> = ({
  mode,
  role,
  availableMenus,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const roleData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        permissions: formData.permissions.map((perm: RolePermission) => ({
          menu_item_id: perm.menu_item_id,
          can_view: perm.can_view,
          can_create: perm.can_create,
          can_edit: perm.can_edit,
          can_delete: perm.can_delete,
          can_export: perm.can_export
        }))
      };
      
      await onSave(roleData);
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermissionChange = (permissions: RolePermission[]) => {
    setFormData(prev => ({ ...prev, permissions }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onCancel}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    {mode === 'create' ? 'Create New Role' : 'Edit Role'}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {mode === 'create' 
                      ? 'Define a new role with specific permissions for your team members.'
                      : 'Update role details and permissions.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 py-4 sm:px-6 max-h-96 overflow-y-auto">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      placeholder="Enter role name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      placeholder="Enter role description"
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Permissions
                  </h4>
                  <PermissionMatrix
                    permissions={formData.permissions}
                    onPermissionChange={handlePermissionChange}
                    availableMenus={availableMenus}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create Role' : 'Update Role')}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;