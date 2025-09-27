'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Upload, Download, Filter, Edit2, Archive } from 'lucide-react';
import DataTable, { TableColumn } from '@/components/tables/DataTable';
import { ActionDropdown, StatusBadge, TagList } from '@/components/tables/TableHelpers';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import Label from '@/components/form/Label';
import { contactsApi, ContactsApiError } from '@/lib/api/contacts';
import type {
  ContactDto,
  ContactImportSummary,
  ContactRole,
  ContactStatus,
} from '@/types/contacts';

const ROLE_OPTIONS: ContactRole[] = ['Customer', 'Supplier', 'Employee'];

export default function ContactsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contacts, setContacts] = useState<ContactDto[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    roles: [] as ContactRole[],
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const [processing, setProcessing] = useState(false);

  const [importSummary, setImportSummary] = useState<ContactImportSummary | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearMessages = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
    setImportSummary(null);
  }, []);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items, metadata } = await contactsApi.listContacts({
        page,
        pageSize,
        search: appliedFilters.search.trim() || undefined,
        roles: appliedFilters.roles.length ? appliedFilters.roles : undefined,
      });
      setContacts(items);
      setTotal(metadata.total);
      setTotalPages(metadata.totalPages || 1);
      if (metadata.page !== page) {
        setPage(metadata.page);
      }
      if (metadata.pageSize !== pageSize) {
        setPageSize(metadata.pageSize);
      }
    } catch (err) {
      console.error('Failed to load contacts', err);
      const message = err instanceof ContactsApiError ? err.message : err instanceof Error ? err.message : 'Failed to load contacts.';
      setError(message);
      setContacts([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const statusParam = searchParams?.get('status');
    if (!statusParam) return;

    if (statusParam === 'created') {
      setSuccessMessage('Contact created successfully.');
    } else if (statusParam === 'updated') {
      setSuccessMessage('Contact updated successfully.');
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('status');
    const query = nextParams.toString();
    router.replace(query ? `/master-data/contacts?${query}` : '/master-data/contacts', { scroll: false });
  }, [router, searchParams]);

  const handlePaginationChange = (nextPage: number, nextPageSize: number) => {
    if (nextPageSize !== pageSize) {
      setPage(1);
      setPageSize(nextPageSize);
    } else {
      setPage(nextPage);
    }
  };

  const handleFilterChange = (key: 'search' | 'status', value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleRoleFilter = (role: ContactRole) => {
    setFilters((prev) => {
      const hasRole = prev.roles.includes(role);
      return {
        ...prev,
        roles: hasRole ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
      };
    });
  };

  const applyFilters = () => {
    clearMessages();
    setAppliedFilters(filters);
    setPage(1);
  };

  const resetFilters = () => {
    const reset = { search: '', roles: [] as ContactRole[] };
    setFilters(reset);
    setAppliedFilters(reset);
    setPage(1);
  };

  const handleArchiveContact = useCallback(async (contact: ContactDto) => {
    if (!confirm(`Archive contact ${contact.name}? This will disable it from future transactions.`)) {
      return;
    }

    try {
      setProcessing(true);
      clearMessages();
      await contactsApi.archiveContact(contact.id);
      setSuccessMessage('Contact archived successfully.');
      await loadContacts();
    } catch (err) {
      console.error('Failed to archive contact', err);
      const message = err instanceof ContactsApiError ? err.message : err instanceof Error ? err.message : 'Failed to archive contact.';
      setError(message);
    } finally {
      setProcessing(false);
    }
  }, [clearMessages, loadContacts]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      clearMessages();
      const summary = await contactsApi.importContacts(file);
      setImportSummary(summary);
      setSuccessMessage('Contacts imported successfully.');
      await loadContacts();
    } catch (err) {
      console.error('Failed to import contacts', err);
      const message = err instanceof ContactsApiError ? err.message : err instanceof Error ? err.message : 'Failed to import contacts.';
      setError(message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    try {
      clearMessages();
      setProcessing(true);
      const blob = await contactsApi.exportContacts({
        search: appliedFilters.search.trim() || undefined,
        roles: appliedFilters.roles.length ? appliedFilters.roles : undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage('Contacts export started successfully.');
    } catch (err) {
      console.error('Failed to export contacts', err);
      const message = err instanceof ContactsApiError ? err.message : err instanceof Error ? err.message : 'Failed to export contacts.';
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const columns: TableColumn<ContactDto>[] = useMemo(() => [
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
      key: 'contact',
      title: 'Contact',
      render: (_, record) => (
        <div className="space-y-0.5">
          {record.email && <div className="text-sm text-gray-600 dark:text-gray-300">{record.email}</div>}
          {record.phone && <div className="text-xs text-gray-500 dark:text-gray-400">{record.phone}</div>}
        </div>
      ),
    },
    {
      key: 'roles',
      title: 'Roles',
      render: (_, record) => <TagList tags={record.roles} variant="primary" maxDisplay={3} />,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <ActionDropdown
          actions={[
            {
              label: 'Edit Contact',
              onClick: () => router.push(`/master-data/contacts/${record.id}/edit`),
              icon: <Edit2 className="h-4 w-4" />,
            },
            {
              label: 'Archive Contact',
              onClick: () => handleArchiveContact(record),
              icon: <Archive className="h-4 w-4" />,
              variant: 'danger',
            },
          ]}
        />
      ),
      className: 'w-14 text-right'
    },
  ], [handleArchiveContact, router]);

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Contacts</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage customers, suppliers, and employees from a single, centralised contact list.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" startIcon={<Filter className="h-4 w-4" />} onClick={applyFilters}>
            Apply Filters
          </Button>
          <Button variant="outline" startIcon={<Download className="h-4 w-4" />} onClick={handleExport} disabled={processing}>
            Export
          </Button>
          <Button variant="outline" startIcon={<Upload className="h-4 w-4" />} onClick={handleImportClick} disabled={importing}>
            Import
          </Button>
          <Button startIcon={<Plus className="h-4 w-4" />} onClick={() => router.push('/master-data/contacts/create')}>
            New Contact
          </Button>
        </div>
      </div>

      {(error || successMessage || importSummary) && (
        <div className="space-y-3">
          {error && <Alert variant="error" title="Error" message={error} />}
          {successMessage && <Alert variant="success" title="Success" message={successMessage} />}
          {importSummary && (
            <Alert
              variant={importSummary.errors.length ? 'warning' : 'info'}
              title="Import Summary"
              message={`Created ${importSummary.created}, Updated ${importSummary.updated}, Skipped ${importSummary.skipped}.`}
            />
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label htmlFor="contact-search">Search</Label>
            <input
              id="contact-search"
              type="text"
              placeholder="Search by name, code, email, or phone"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-white/40"
            />
          </div>
          <div>
            <Label>Roles</Label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => {
                const checked = filters.roles.includes(role);
                return (
                  <label key={role} className="inline-flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRoleFilter(role)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span>{role}</span>
                  </label>
                );
              })}
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
        data={contacts}
        loading={loading}
        emptyText="No contacts found."
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
