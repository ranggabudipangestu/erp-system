'use client';

import { useState } from 'react';
import InviteUserForm from '@/components/auth/InviteUserForm';
import Alert from '@/components/ui/alert/Alert';
import { authApi } from '@/app/lib/authApi';
import { CreateInviteRequest } from '@/types/auth';
import { DataTable, TableColumn } from '@/components/tables';
import { UserInfo, StatusBadge, TagList, ActionDropdown, DateDisplay } from '@/components/tables/TableHelpers';
import type { ActionItem } from '@/components/tables/TableHelpers';

type UsersPageState = 'list' | 'invite';

export default function UsersPage() {
  const [state, setState] = useState<UsersPageState>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Mock user data - in real app, fetch from API
  const users = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      roles: ['admin', 'finance'],
      status: 'active',
      joinedAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      roles: ['sales'],
      status: 'active',
      joinedAt: '2024-02-10'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      roles: ['marketing'],
      status: 'active',
      joinedAt: '2024-01-20'
    },
    {
      id: '4',
      name: 'Sarah Wilson',
      email: 'sarah@example.com',
      roles: ['hr', 'admin'],
      status: 'inactive',
      joinedAt: '2024-01-05'
    },
    {
      id: '5',
      name: 'David Brown',
      email: 'david@example.com',
      roles: ['finance'],
      status: 'active',
      joinedAt: '2024-02-01'
    },
    {
      id: '6',
      name: 'Lisa Garcia',
      email: 'lisa@example.com',
      roles: ['sales', 'marketing'],
      status: 'active',
      joinedAt: '2024-01-25'
    },
    {
      id: '7',
      name: 'Tom Anderson',
      email: 'tom@example.com',
      roles: ['tech'],
      status: 'active',
      joinedAt: '2024-02-15'
    },
    {
      id: '8',
      name: 'Emma Davis',
      email: 'emma@example.com',
      roles: ['support'],
      status: 'active',
      joinedAt: '2024-01-30'
    },
    {
      id: '9',
      name: 'Chris Miller',
      email: 'chris@example.com',
      roles: ['tech', 'admin'],
      status: 'inactive',
      joinedAt: '2024-01-10'
    },
    {
      id: '10',
      name: 'Anna Taylor',
      email: 'anna@example.com',
      roles: ['design'],
      status: 'active',
      joinedAt: '2024-02-05'
    },
    {
      id: '11',
      name: 'James White',
      email: 'james@example.com',
      roles: ['sales'],
      status: 'active',
      joinedAt: '2024-01-18'
    },
    {
      id: '12',
      name: 'Maria Rodriguez',
      email: 'maria@example.com',
      roles: ['hr'],
      status: 'active',
      joinedAt: '2024-02-12'
    }
  ];

  const handlePaginationChange = (page: number, newPageSize: number) => {
    setCurrentPage(page);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  const handleEditUser = (user: any) => {
    alert(`Edit user ${user.name}`);
  };

  const handleDisableUser = (user: any) => {
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
          variant={record.status === 'active' ? 'success' : 'default'}
        />
      ),
      sortable: true,
    },
    {
      key: 'joinedAt',
      title: 'Joined',
      render: (_, record) => (
        <DateDisplay date={record.joinedAt} format="medium" />
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

  const handleInviteUser = async (data: CreateInviteRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get tenant and user info from localStorage (in real app, this would come from auth context)
      const tenantId = localStorage.getItem('erp_tenant_id') || '';
      const userId = localStorage.getItem('erp_user_id') || '';

      await authApi.createInvitation(data, tenantId, userId);
      
      setSuccess(`Invitation sent successfully to ${data.email}!`);
      setShowToast(true);
      setState('list');
      
      // Auto hide toast after 5 seconds
      setTimeout(() => {
        setShowToast(false);
        setSuccess(null);
      }, 5000);
      
    } catch (error: any) {
      console.error('Invite user error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.status === 400) {
        if (error.message.includes('already exists')) {
          errorMessage = 'A user with this email already exists.';
        } else if (error.message.includes('pending invitation')) {
          errorMessage = 'A pending invitation for this email already exists.';
        } else {
          errorMessage = error.message;
        }
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setShowToast(true);
      
      // Auto hide toast after 5 seconds
      setTimeout(() => {
        setShowToast(false);
        setError(null);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseToast = () => {
    setShowToast(false);
    setError(null);
    setSuccess(null);
  };

  if (state === 'invite') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button
              onClick={() => setState('list')}
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
            onCancel={() => setState('list')}
          />

          {/* Toast Alerts */}
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

          {showToast && success && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
              <div className="relative">
                <Alert
                  variant="success"
                  title="Invitation Sent"
                  message={success}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
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
              <button
                onClick={() => setState('invite')}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Invite User
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
          </div>
          
          <div className="p-6">
            <DataTable
              columns={columns}
              data={users}
              emptyText="No team members found"
              className="shadow-none border-0"
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


        {/* Toast Alerts */}
        {showToast && success && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
            <div className="relative">
              <Alert
                variant="success"
                title="Invitation Sent"
                message={success}
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