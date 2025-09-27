'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DataTable, TableColumn } from '@/components/tables';
import { StatusBadge, ActionDropdown, CurrencyDisplay, DateDisplay } from '@/components/tables/TableHelpers';
import type { ActionItem } from '@/components/tables/TableHelpers';
import { PermissionGate, usePermissions } from '@/hooks/usePermissions';
import ProtectedPermissionRoute from '@/components/auth/ProtectedPermissionRoute';

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  total: number;
  status: 'paid' | 'pending' | 'overdue';
};

// Sample data
const sampleInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-001',
    customerName: 'John Doe',
    date: '2024-01-15',
    total: 1250.00,
    status: 'paid'
  },
  {
    id: '2',
    invoiceNumber: 'INV-002',
    customerName: 'Jane Smith',
    date: '2024-01-20',
    total: 875.50,
    status: 'pending'
  },
  {
    id: '3',
    invoiceNumber: 'INV-003',
    customerName: 'Acme Corp',
    date: '2024-01-10',
    total: 2100.75,
    status: 'overdue'
  },
  {
    id: '4',
    invoiceNumber: 'INV-004',
    customerName: 'Tech Solutions',
    date: '2024-01-25',
    total: 450.00,
    status: 'pending'
  },
  {
    id: '5',
    invoiceNumber: 'INV-005',
    customerName: 'Microsoft Inc',
    date: '2024-02-01',
    total: 3500.00,
    status: 'paid'
  },
  {
    id: '6',
    invoiceNumber: 'INV-006',
    customerName: 'Apple Corp',
    date: '2024-02-05',
    total: 1800.25,
    status: 'pending'
  },
  {
    id: '7',
    invoiceNumber: 'INV-007',
    customerName: 'Google LLC',
    date: '2024-01-30',
    total: 2750.00,
    status: 'overdue'
  },
  {
    id: '8',
    invoiceNumber: 'INV-008',
    customerName: 'Amazon Inc',
    date: '2024-02-10',
    total: 980.00,
    status: 'paid'
  },
  {
    id: '9',
    invoiceNumber: 'INV-009',
    customerName: 'Netflix Inc',
    date: '2024-02-12',
    total: 1200.00,
    status: 'pending'
  },
  {
    id: '10',
    invoiceNumber: 'INV-010',
    customerName: 'Meta Platforms',
    date: '2024-02-08',
    total: 1650.50,
    status: 'overdue'
  },
  {
    id: '11',
    invoiceNumber: 'INV-011',
    customerName: 'Tesla Inc',
    date: '2024-02-15',
    total: 4200.00,
    status: 'paid'
  },
  {
    id: '12',
    invoiceNumber: 'INV-012',
    customerName: 'SpaceX LLC',
    date: '2024-02-18',
    total: 5500.75,
    status: 'pending'
  }
];

export default function InvoiceList() {
  const { canView, canCreate, canEdit, canDelete } = usePermissions();
  const [invoices, setInvoices] = useState<Invoice[]>(sampleInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    alert(`View invoice ${invoice.invoiceNumber}`);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    alert(`Edit invoice ${invoice.invoiceNumber}`);
  };

  const handleDuplicateInvoice = (invoice: Invoice) => {
    alert(`Duplicate invoice ${invoice.invoiceNumber}`);
  };

  const handleSendInvoice = (invoice: Invoice) => {
    alert(`Send invoice ${invoice.invoiceNumber} to ${invoice.customerName}`);
  };

  const handlePaginationChange = (page: number, newPageSize: number) => {
    setCurrentPage(page);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns: TableColumn<Invoice>[] = [
    {
      key: 'invoiceNumber',
      title: 'Invoice Number',
      render: (_, record) => (
        <span className="font-medium text-black dark:text-white">
          {record.invoiceNumber}
        </span>
      ),
      sortable: true,
      className: 'min-w-[140px]'
    },
    {
      key: 'customerName',
      title: 'Customer',
      render: (_, record) => (
        <span className="text-gray-900 dark:text-gray-100">
          {record.customerName}
        </span>
      ),
      sortable: true,
      className: 'min-w-[160px]'
    },
    {
      key: 'date',
      title: 'Date',
      render: (_, record) => (
        <DateDisplay date={record.date} format="medium" />
      ),
      sortable: true,
      className: 'min-w-[120px]'
    },
    {
      key: 'total',
      title: 'Amount',
      render: (_, record) => (
        <CurrencyDisplay amount={record.total} currency="USD" />
      ),
      sortable: true,
      className: 'min-w-[120px]'
    },
    {
      key: 'actions',
      title: '',
      render: (_, record) => {
        const actions: ActionItem[] = [
          {
            label: 'View Details',
            onClick: () => handleViewInvoice(record),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ),
          },
          {
            label: 'Edit Invoice',
            onClick: () => handleEditInvoice(record),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ),
          },
          {
            label: 'Send Invoice',
            onClick: () => handleSendInvoice(record),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            ),
          },
          {
            label: 'Duplicate',
            onClick: () => handleDuplicateInvoice(record),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ),
            divider: true,
          },
          {
            label: 'Delete',
            onClick: () => handleDeleteInvoice(record.id),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ),
            variant: 'danger',
          },
        ];

        return <ActionDropdown actions={actions} />;
      },
      className: 'w-[60px] text-center',
    },
  ];

  return (
    <ProtectedPermissionRoute 
      permission="sales.invoices.view" 
      action="can_view"
      fallback={
        <div className="mx-auto max-w-none px-2 sm:px-4 lg:px-6 py-8">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="p-8 text-center">
              <div className="text-red-600 text-lg font-semibold mb-2">Access Denied</div>
              <div className="text-gray-600 dark:text-gray-400">You don't have permission to view invoices.</div>
            </div>
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-none px-2 sm:px-4 lg:px-6 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Invoice List
        </h2>
        <nav>
          <ol className="flex items-center gap-2">
            <li>
              <Link className="font-medium" href="/">
                Home /
              </Link>
            </li>
            <li className="font-medium text-primary">Invoice List</li>
          </ol>
        </nav>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h3 className="font-medium text-black dark:text-white">
              All Invoices
            </h3>
            <PermissionGate permission="sales.invoices.view" action="can_create">
              <Link
                href="/sales/invoice/create"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
              >
                Create New Invoice
              </Link>
            </PermissionGate>
          </div>
        </div>

        <div className="p-6.5">
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by invoice number or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Invoice Table */}
          <DataTable
            columns={columns}
            data={filteredInvoices}
            emptyText="No invoices found"
            className="shadow-none border-0"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              onChange: handlePaginationChange,
              showSizeChanger: true,
              pageSizeOptions: [5, 10, 20, 50]
            }}
          />

          {/* Summary Stats */}
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="text-center">
                <h4 className="text-xl font-semibold text-black dark:text-white">
                  {invoices.length}
                </h4>
                <p className="text-sm text-gray-500">Total Invoices</p>
              </div>
            </div>
            <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="text-center">
                <h4 className="text-xl font-semibold text-green-500">
                  {invoices.filter(inv => inv.status === 'paid').length}
                </h4>
                <p className="text-sm text-gray-500">Paid</p>
              </div>
            </div>
            <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="text-center">
                <h4 className="text-xl font-semibold text-yellow-500">
                  {invoices.filter(inv => inv.status === 'pending').length}
                </h4>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
            <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="text-center">
                <h4 className="text-xl font-semibold text-red-500">
                  {invoices.filter(inv => inv.status === 'overdue').length}
                </h4>
                <p className="text-sm text-gray-500">Overdue</p>
              </div>
            </div>
          </div>

          {/* Total Amount Summary */}
          <div className="mt-6">
            <div className="rounded-sm border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4">
              <div className="flex justify-between">
                <span className="font-medium text-black dark:text-white">
                  Total Invoice Amount:
                </span>
                <span className="font-semibold text-black dark:text-white">
                  ${invoices.reduce((sum, invoice) => sum + invoice.total, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </ProtectedPermissionRoute>
  );
}