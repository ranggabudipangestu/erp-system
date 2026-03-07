"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Filter, Edit2, Archive } from "lucide-react";
import DataTable, { TableColumn } from "@/components/tables/DataTable";
import { ActionDropdown, StatusBadge } from "@/components/tables/TableHelpers";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import Label from "@/components/form/Label";
import { useDebounce } from "@/hooks/useDebounce";
import { currenciesApi } from "@/lib/api/master-data/currencies";
import type { Currency } from "@/types/currencies";

export default function CurrenciesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    include_archived: false,
  });
  const debouncedSearch = useDebounce(filters.search, 500);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.include_archived]);

  const [processing, setProcessing] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Currency | null>(null);

  const clearMessages = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
  }, []);

  const loadCurrencies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await currenciesApi.list({
        page,
        page_size: pageSize,
        search: debouncedSearch.trim() || undefined,
        include_archived: filters.include_archived,
      });
      setCurrencies(response.result || []);
      const meta = response.metadata;
      if (meta) {
        setTotal(meta.total || 0);
        setTotalPages(meta.totalPages || 1);
        if (meta.page && meta.page !== page) {
          setPage(meta.page);
        }
        if (meta.pageSize && meta.pageSize !== pageSize) {
          setPageSize(meta.pageSize);
        }
      }
    } catch (err: any) {
      console.error("Failed to load currencies", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load currencies.",
      );
      setCurrencies([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, filters.include_archived]);

  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  useEffect(() => {
    const statusParam = searchParams?.get("status");
    if (!statusParam) return;

    if (statusParam === "created") {
      setSuccessMessage("Currency created successfully.");
    } else if (statusParam === "updated") {
      setSuccessMessage("Currency updated successfully.");
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("status");
    const query = nextParams.toString();
    router.replace(
      query ? `/master-data/currencies?${query}` : "/master-data/currencies",
      { scroll: false },
    );
  }, [router, searchParams]);

  const handlePaginationChange = (nextPage: number, nextPageSize: number) => {
    if (nextPageSize !== pageSize) {
      setPage(1);
      setPageSize(nextPageSize);
    } else {
      setPage(nextPage);
    }
  };

  const handleFilterChange = (key: "search", value: string) => {
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

  const resetFilters = () => {
    setFilters({ search: "", include_archived: false });
    setPage(1);
  };

  const handleArchiveCurrency = useCallback(async (currency: Currency) => {
    setArchiveTarget(currency);
  }, []);

  const confirmArchive = useCallback(async () => {
    if (!archiveTarget) return;
    try {
      setProcessing(true);
      clearMessages();
      await currenciesApi.archive(archiveTarget.id);
      setSuccessMessage("Currency archived successfully.");
      setArchiveTarget(null);
      await loadCurrencies();
    } catch (err: any) {
      console.error("Failed to archive currency", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to archive currency.",
      );
      setArchiveTarget(null);
    } finally {
      setProcessing(false);
    }
  }, [archiveTarget, clearMessages, loadCurrencies]);

  const columns: TableColumn<Currency>[] = useMemo(
    () => [
      {
        key: "code",
        title: "Code",
        sortable: true,
        render: (_, record) => (
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {record.code}
          </div>
        ),
        className: "min-w-[100px]",
      },
      {
        key: "name",
        title: "Name",
        sortable: true,
        render: (_, record) => (
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {record.name}
          </div>
        ),
      },
      {
        key: "symbol",
        title: "Symbol",
        sortable: true,
        render: (_, record) => (
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {record.symbol}
          </div>
        ),
      },
      {
        key: "exchange_rate",
        title: "Exchange Rate",
        sortable: true,
        render: (_, record) => (
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {typeof record.exchange_rate === "number"
              ? Number(record.exchange_rate).toFixed(4)
              : record.exchange_rate}
          </div>
        ),
      },
      {
        key: "status",
        title: "Status",
        render: (_, record) => (
          <StatusBadge
            variant={record.deleted_at ? "error" : "success"}
            status={record.deleted_at ? "Archived" : "Active"}
          />
        ),
      },
      {
        key: "actions",
        title: "Actions",
        render: (_, record) => {
          const actions = [
            {
              label: "Edit Currency",
              onClick: () =>
                router.push(`/master-data/currencies/${record.id}/edit`),
              icon: <Edit2 className="h-4 w-4" />,
            },
          ];

          if (!record.deleted_at) {
            actions.push({
              label: "Archive Currency",
              onClick: () => handleArchiveCurrency(record),
              icon: <Archive className="h-4 w-4" />,
            });
          }

          return <ActionDropdown actions={actions} />;
        },
        className: "w-14 text-right",
      },
    ],
    [handleArchiveCurrency, router],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Currencies
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage currencies and exchange rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => router.push("/master-data/currencies/create")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Currency
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {successMessage && (
        <Alert variant="success" title="Success" message={successMessage} />
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-1.5 pt-px">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Search by code or name..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 outline-none transition hover:border-brand-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90 dark:hover:border-brand-500 dark:focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="statusFilter">Status</Label>
            <select
              id="statusFilter"
              className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none transition hover:border-brand-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90 dark:hover:border-brand-500 dark:focus:border-brand-500"
              value={filters.include_archived ? "all" : "active"}
              onChange={(e) => handleArchivedToggle(e.target.value === "all")}
            >
              <option value="active">Active Only</option>
              <option value="all">Include Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="h-10 px-4"
            >
              Clear
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={currencies}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: handlePaginationChange,
            showSizeChanger: true,
            pageSizeOptions: [10, 25, 50, 100],
            serverSide: true,
          }}
          emptyText="No currencies found. Click 'Add Currency' to create one."
        />
      </div>

      <ConfirmModal
        isOpen={!!archiveTarget}
        title="Archive Currency"
        message={`Are you sure you want to archive the currency "${archiveTarget?.name} (${archiveTarget?.code})"?`}
        confirmLabel="Yes, Archive"
        cancelLabel="Cancel"
        variant="danger"
        loading={processing}
        onConfirm={confirmArchive}
        onClose={() => setArchiveTarget(null)}
      />
    </div>
  );
}
