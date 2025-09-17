'use client';

import React from 'react';
import RoleManagement from '@/components/permissions/RoleManagement';
import ProtectedPermissionRoute from '@/components/auth/ProtectedPermissionRoute';
import { PermissionProvider } from '@/hooks/usePermissions';

export default function RolesPage() {
  return (
    <PermissionProvider>
      <ProtectedPermissionRoute
        permission="roles.view"
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-600 text-lg font-semibold">Access Denied</div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">You don't have permission to manage roles.</div>
            </div>
          </div>
        }
      >
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <RoleManagement />
          </div>
        </div>
      </ProtectedPermissionRoute>
    </PermissionProvider>
  );
}