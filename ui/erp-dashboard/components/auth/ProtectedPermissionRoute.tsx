'use client';

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

interface ProtectedPermissionRouteProps {
  children: ReactNode;
  permission: string;
  action?: string;
  redirectTo?: string;
  fallback?: ReactNode;
}

const ProtectedPermissionRoute: React.FC<ProtectedPermissionRouteProps> = ({
  children,
  permission,
  action = 'can_view',
  redirectTo = '/dashboard',
  fallback = null
}) => {
  const { hasPermission, isLoading } = usePermissions();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!hasPermission(permission, action)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Redirect to specified route
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold">Access Denied</div>
          <div className="text-gray-600 mt-2">You don't have permission to access this page.</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedPermissionRoute;