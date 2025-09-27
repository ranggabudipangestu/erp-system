'use client';

import React from 'react';
import ProtectedPermissionRoute from '@/components/auth/ProtectedPermissionRoute';
import { PermissionProvider } from '@/hooks/usePermissions';
import RoleForm from '@/components/permissions/RoleForm';

interface EditRolePageContentProps {
  roleId?: string;
}

const EditRolePageContent: React.FC<EditRolePageContentProps> = ({ roleId }) => {
  if (!roleId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Invalid role identifier.</div>
      </div>
    );
  }

  return (
    <PermissionProvider>
      <ProtectedPermissionRoute permission="roles.view" action="can_edit" redirectTo="/user-management/roles">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <RoleForm mode="edit" roleId={roleId} />
          </div>
        </div>
      </ProtectedPermissionRoute>
    </PermissionProvider>
  );
};

export default EditRolePageContent;