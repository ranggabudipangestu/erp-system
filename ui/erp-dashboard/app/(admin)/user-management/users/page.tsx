'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Alert from '@/components/ui/alert/Alert';
import { DataTable, TableColumn } from '@/components/tables';
import { UserInfo, StatusBadge, TagList, ActionDropdown, DateDisplay } from '@/components/tables/TableHelpers';
import type { ActionItem } from '@/components/tables/TableHelpers';
import { authApi } from '@/app/lib/authApi';

interface UserTableRecord {
  id: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
  joinedAt?: string | null;
  isPrimary: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserTableRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showToast, setShowToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      setLoadError(null);

      const response = await authApi.getTenantUsers();

      const mappedUsers: UserTableRecord[] = response.map((member) => {
        const status = member.status?.toLowerCase() || 'pending';

        return {
          id: member.user_id,
          name: member.name,
          email: member.email,
          roles: member.roles ?? [],
          status,
          joinedAt: member.joined_at,
          isPrimary: member.is_primary,
        };
      });

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Failed to load user list:', error);
      const message = error instanceof Error ? error.message : 'Failed to load users. Please try again later.';
      setLoadError(message);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const status = searchParams.get('inviteStatus');
    const email = searchParams.get('invitedEmail');
    let timer: number | null = null;

    if (status === 'success' && email) {
      setSuccessMessage(`Invitation sent successfully to ${email}!`);
      setShowToast(true);

      // Refresh list after successful invitation
      loadUsers();

      timer = window.setTimeout(() => {
        setShowToast(false);
        setSuccessMessage(null);
      }, 5000);

      router.replace('/user-management/users');
    }

    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [searchParams, router, loadUsers]);

  const handleCloseToast = () => {
    setShowToast(false);
    setSuccessMessage(null);
  };

  const handlePaginationChange = (page: number, newPageSize: number) => {
    setCurrentPage(page);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  const handleEditUser = (user: UserTableRecord) => {
    alert(`Edit user ${user.name}`);
  };

  const handleDisableUser = (user: UserTableRecord) => {
    if (confirm(`Are you sure you want to disable ${user.name}?`)) {
      alert(`User ${user.name} disabled`);
    }
  };

  const columns: TableColumn[] = [
    {
      key: 'user',
      title: 'User',
      render: (_, record) => (
        <UserInfo
          name={record.name}
          email={record.email}
          role={record.isPrimary ? 'Primary Tenant' : undefined}
          size="md"
        />
      ),
      className: 'min-w-[250px]'
    },
    {
      key: 'roles',
      title: 'Roles',
      render: (_, record) => (
        <TagList
          tags={record.roles}
          variant="primary"
          maxDisplay={3}
        />
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, record) => (
        <StatusBadge
          status={record.status}
          variant={record.status === 'active' ? 'success' : record.status === 'pending' ? 'warning' : 'default'}
        />
      ),
      sortable: true,
    },
    {
      key: 'joinedAt',
      title: 'Joined',
      render: (_, record) => (
        record.joinedAt ? (
          <DateDisplay date={record.joinedAt} format="medium" />
        ) : (
          <span className="text-gray-500">—</span>
        )
      ),
      sortable: true,
    },
    {
      key: 'actions',
      title: '',
      render: (_, record) => {
        const actions: ActionItem[] = [
          {
            label: 'View Profile',
            onClick: () => alert(`View profile for ${record.name}`),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ),
          },
          {
            label: 'Edit User',
            onClick: () => handleEditUser(record),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ),
          },
          {
            label: 'Reset Password',
            onClick: () => alert(`Reset password for ${record.name}`),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2H7v-2H4a1 1 0 01-1-1v-4c0-2.946 2.579-6.816 8-6.816 2.21 0 4.21.896 5.657 2.343z" />
              </svg>
            ),
            divider: true,
          },
          {
            label: record.status === 'active' ? 'Disable User' : 'Enable User',
            onClick: () => handleDisableUser(record),
            icon: record.status === 'active' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ),
            variant: record.status === 'active' ? 'danger' : 'success',
          },
        ];

        return <ActionDropdown actions={actions} />;
      },
      className: 'w-[60px] text-center',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                User Management
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage team members and their roles within your organization
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                href="/user-management/users/invite"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Invite User
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
          </div>

          <div className="p-6">
            {loadError && (
              <div className="mb-4">
                <Alert
                  variant="error"
                  title="Failed to load users"
                  message={loadError}
                  showLink={false}
                />
                <div className="mt-3">
                  <button
                    onClick={loadUsers}
                    className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            <DataTable
              columns={columns}
              data={users}
              emptyText="No team members found"
              className="shadow-none border-0"
              loading={isLoadingUsers}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                onChange: handlePaginationChange,
                showSizeChanger: true,
                pageSizeOptions: [5, 10, 20, 50]
              }}
            />
          </div>
        </div>

        {showToast && successMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
            <div className="relative">
              <Alert
                variant="success"
                title="Invitation Sent"
                message={successMessage}
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
  );
}
