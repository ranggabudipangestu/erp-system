'use client';

import { useState } from 'react';
import Link from 'next/link';

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
  }
];

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>(sampleInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success text-success bg-opacity-10';
      case 'pending':
        return 'bg-warning text-warning bg-opacity-10';
      case 'overdue':
        return 'bg-danger text-danger bg-opacity-10';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  return (
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
            <Link
              href="/sales/invoice/create"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
            >
              Create New Invoice
            </Link>
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
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="px-4 py-4 font-medium text-black dark:text-white">
                    Invoice Number
                  </th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">
                    Customer
                  </th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">
                    Date
                  </th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">
                    Amount
                  </th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">
                    Status
                  </th>
                  <th className="px-4 py-4 font-medium text-black dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                        <p className="font-medium text-black dark:text-white">
                          {invoice.invoiceNumber}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                        <p className="text-black dark:text-white">
                          {invoice.customerName}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                        <p className="text-black dark:text-white">
                          {new Date(invoice.date).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                        <p className="text-black dark:text-white">
                          ${invoice.total.toFixed(2)}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                        <p
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium capitalize ${getStatusColor(
                            invoice.status,
                          )}`}
                        >
                          {invoice.status}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                        <div className="flex items-center space-x-3.5">
                          <button
                            className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                            onClick={() => {
                              // TODO: Implement view invoice
                              alert(`View invoice ${invoice.invoiceNumber}`);
                            }}
                          >
                            View
                          </button>
                          <button
                            className="rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
                            onClick={() => {
                              // TODO: Implement edit invoice
                              alert(`Edit invoice ${invoice.invoiceNumber}`);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="border-b border-[#eee] px-4 py-8 text-center dark:border-strokedark">
                      <p className="text-gray-500 dark:text-gray-400">
                        No invoices found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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
  );
}