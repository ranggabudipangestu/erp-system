'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Download, Filter, Edit2, Archive } from 'lucide-react';
import DataTable, { TableColumn } from '@/components/tables/DataTable';
import { ActionDropdown, StatusBadge } from '@/components/tables/TableHelpers';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import Label from '@/components/form/Label';
import { paymentTermsApi, PaymentTermsApiError } from '@/lib/api/payment-terms';
import type { PaymentTermDto } from '@/types/payment-terms';

export default function PaymentTermsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [paymentTerms, setPaymentTerms] = useState<PaymentTermDto[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    include_archived: false,
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const [processing, setProcessing] = useState(false);

  const clearMessages = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
  }, []);

  const loadPaymentTerms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items, metadata } = await paymentTermsApi.listPaymentTerms({
        page,
        pageSize,
        search: appliedFilters.search.trim() || undefined,
        include_archived: appliedFilters.include_archived,
      });
      setPaymentTerms(items);
      setTotal(metadata.total);
      setTotalPages(metadata.totalPages || 1);
      if (metadata.page !== page) {
        setPage(metadata.page);
      }
      if (metadata.pageSize !== pageSize) {
        setPageSize(metadata.pageSize);
      }
    } catch (err) {
      console.error('Failed to load payment terms', err);
      const message = err instanceof PaymentTermsApiError ? err.message : err instanceof Error ? err.message : 'Failed to load payment terms.';
      setError(message);
      setPaymentTerms([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters]);

  useEffect(() => {
    loadPaymentTerms();
  }, [loadPaymentTerms]);

  useEffect(() => {
    const statusParam = searchParams?.get('status');
    if (!statusParam) return;

    if (statusParam === 'created') {
      setSuccessMessage('Payment term created successfully.');
    } else if (statusParam === 'updated') {
      setSuccessMessage('Payment term updated successfully.');
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('status');
    const query = nextParams.toString();
    router.replace(query ? `/master-data/payment-terms?${query}` : '/master-data/payment-terms', { scroll: false });
  }, [router, searchParams]);

  const handlePaginationChange = (nextPage: number, nextPageSize: number) => {
    if (nextPageSize !== pageSize) {
      setPage(1);
      setPageSize(nextPageSize);
    } else {
      setPage(nextPage);
    }
  };

  const handleFilterChange = (key: 'search', value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleArchivedToggle = (include_archived: boolean) => {
    setFilters((prev) => ({
      ...prev,
      include_archived,
    }));
  };

  const applyFilters = () => {
    clearMessages();
    setAppliedFilters(filters);
    setPage(1);
  };

  const resetFilters = () => {
    const reset = { search: '', include_archived: false };
    setFilters(reset);
    setAppliedFilters(reset);
    setPage(1);
  };

  const handleArchivePaymentTerm = useCallback(async (paymentTerm: PaymentTermDto) => {
    if (!confirm(`Archive payment term "${paymentTerm.name}"? This will disable it from future use.`)) {
      return;
    }

    try {
      setProcessing(true);
      clearMessages();
      await paymentTermsApi.archivePaymentTerm(paymentTerm.id);
      setSuccessMessage('Payment term archived successfully.');
      await loadPaymentTerms();
    } catch (err) {
      console.error('Failed to archive payment term', err);
      const message = err instanceof PaymentTermsApiError ? err.message : err instanceof Error ? err.message : 'Failed to archive payment term.';
      setError(message);
    } finally {
      setProcessing(false);
    }
  }, [clearMessages, loadPaymentTerms]);

  const handleExport = async () => {
    try {
      clearMessages();
      setProcessing(true);
      const blob = await paymentTermsApi.exportPaymentTerms({
        search: appliedFilters.search.trim() || undefined,
        include_archived: appliedFilters.include_archived,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment_terms_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage('Payment terms export started successfully.');
    } catch (err) {
      console.error('Failed to export payment terms', err);
      const message = err instanceof PaymentTermsApiError ? err.message : err instanceof Error ? err.message : 'Failed to export payment terms.';
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const columns: TableColumn<PaymentTermDto>[] = useMemo(() => [
    {
      key: 'code',
      title: 'Code',
      sortable: true,
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{record.code}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{record.name}</div>
        </div>
      ),
      className: 'min-w-[160px]'
    },
    {
      key: 'description',
      title: 'Description',
      render: (_, record) => (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {record.description || '-'}
        </div>
      ),
    },
    {
      key: 'due_days',
      title: 'Due Days',
      render: (_, record) => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {record.due_days} days
        </div>
      ),
    },
    {
      key: 'discount',
      title: 'Early Payment Discount',
      render: (_, record) => {
        if (!record.early_payment_discount_percent || !record.early_payment_discount_days) {
          return <div className="text-sm text-gray-500 dark:text-gray-400">-</div>;
        }
        return (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {record.early_payment_discount_percent}% within {record.early_payment_discount_days} days
          </div>
        );
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, record) => (
        <StatusBadge
          variant={record.archived_at ? 'error' : 'success'}
          label={record.archived_at ? 'Archived' : 'Active'}
        />
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <ActionDropdown
          actions={[
            {
              label: 'Edit Payment Term',
              onClick: () => router.push(`/master-data/payment-terms/${record.id}/edit`),
              icon: <Edit2 className="h-4 w-4" />,
            },
            !record.archived_at ? {
              label: 'Archive Payment Term',
              onClick: () => handleArchivePaymentTerm(record),
              icon: <Archive className="h-4 w-4" />,
              variant: 'danger',
            } : null,
          ].filter(Boolean)}
        />
      ),
      className: 'w-14 text-right'
    },
  ], [handleArchivePaymentTerm, router]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Payment Terms</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage payment terms for customers and suppliers.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" startIcon={<Filter className="h-4 w-4" />} onClick={applyFilters}>
            Apply Filters
          </Button>
          <Button variant="outline" startIcon={<Download className="h-4 w-4" />} onClick={handleExport} disabled={processing}>
            Export
          </Button>
          <Button startIcon={<Plus className="h-4 w-4" />} onClick={() => router.push('/master-data/payment-terms/create')}>
            New Payment Term
          </Button>
        </div>
      </div>

      {(error || successMessage) && (
        <div className="space-y-3">
          {error && <Alert variant="error" title="Error" message={error} />}
          {successMessage && <Alert variant="success" title="Success" message={successMessage} />}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Label htmlFor="payment-term-search">Search</Label>
            <input
              id="payment-term-search"
              type="text"
              placeholder="Search by code, name, or description"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-white/40"
            />
          </div>
          <div>
            <Label>Options</Label>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.include_archived}
                  onChange={(e) => handleArchivedToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span>Include Archived</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button variant="primary" size="sm" onClick={applyFilters}>
            Apply
          </Button>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paymentTerms}
        loading={loading}
        emptyText="No payment terms found."
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: handlePaginationChange,
          showSizeChanger: true,
          pageSizeOptions: [10, 25, 50, 100],
          serverSide: true,
        }}
      />
    </div>
  );
}