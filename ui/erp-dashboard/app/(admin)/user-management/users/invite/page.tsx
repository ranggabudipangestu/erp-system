'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import InviteUserForm, { RoleOption } from '@/components/auth/InviteUserForm';
import Alert from '@/components/ui/alert/Alert';
import ProtectedPermissionRoute from '@/components/auth/ProtectedPermissionRoute';
import { PermissionProvider } from '@/hooks/usePermissions';
import { authApi } from '@/app/lib/authApi';
import type { CreateInviteRequest } from '@/types/auth';
import { permissionService } from '@/lib/api/permissions';

const INVITE_SUCCESS_QUERY = '/user-management/users?inviteStatus=success&invitedEmail=';

export default function InviteUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      setIsRolesLoading(true);
      setRolesError(null);

      const roles = await permissionService.getRoles();

      const mappedRoles: RoleOption[] = roles.map((role) => ({
        value: role.name,
        label: role.name,
        description: role.description,
        isSystem: (role as any).is_system ?? (role as any).is_system_role ?? false,
      }));

      mappedRoles.sort((a, b) => a.label.localeCompare(b.label));

      setAvailableRoles(mappedRoles);
    } catch (err) {
      console.error('Failed to load roles for invitations:', err);
      setRolesError('Failed to load roles. Please try again.');
      setAvailableRoles([]);
    } finally {
      setIsRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const scheduleToastDismissal = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
      setError(null);
    }, 5000);
  };

  const handleInviteUser = async (data: CreateInviteRequest) => {
    setIsLoading(true);
    setError(null);
    setShowToast(false);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    try {
      const tenantId = localStorage.getItem('erp_tenant_id') || '';
      const userId = localStorage.getItem('erp_user_id') || '';

      await authApi.createInvitation(data, tenantId, userId);

      router.push(`${INVITE_SUCCESS_QUERY}${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      console.error('Invite user error:', err);

      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err?.status === 400) {
        if (err?.message?.includes('already exists')) {
          errorMessage = 'A user with this email already exists.';
        } else if (err?.message?.includes('pending invitation')) {
          errorMessage = 'A pending invitation for this email already exists.';
        } else if (err?.message) {
          errorMessage = err.message;
        }
      } else if (err?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err?.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setShowToast(true);
      scheduleToastDismissal();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setShowToast(false);
    setError(null);
  };

  const handleCancel = () => {
    router.push('/user-management/users');
  };

  const handleBack = () => {
    router.push('/user-management/users');
  };

  const handleRetryLoadRoles = () => {
    loadRoles();
  };

  return (
    <PermissionProvider>
      <ProtectedPermissionRoute permission="users.view" action="can_create" redirectTo="/user-management/users">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <button
                onClick={handleBack}
                className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Users
              </button>
            </div>

            <InviteUserForm
              onSubmit={handleInviteUser}
              isLoading={isLoading}
              onCancel={handleCancel}
              availableRoles={availableRoles}
              isRolesLoading={isRolesLoading}
              rolesError={rolesError}
              onRetryLoadRoles={handleRetryLoadRoles}
            />

            {showToast && error && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
                <div className="relative">
                  <Alert
                    variant="error"
                    title="Invitation Failed"
                    message={error}
                    showLink={false}
                  />
                  <button
                    onClick={handleCloseToast}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </ProtectedPermissionRoute>
    </PermissionProvider>
  );
}
