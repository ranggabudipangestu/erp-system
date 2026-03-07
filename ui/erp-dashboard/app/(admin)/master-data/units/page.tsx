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
import { unitsApi, UnitsApiError } from "@/lib/api/units";
import type { Unit } from "@/types/units";

export default function UnitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [units, setUnits] = useState<Unit[]>([]);
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
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const [processing, setProcessing] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Unit | null>(null);

  const clearMessages = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
  }, []);

  const loadUnits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await unitsApi.getUnits({
        page,
        page_size: pageSize,
        search: appliedFilters.search.trim() || undefined,
        include_archived: appliedFilters.include_archived,
      });
      setUnits(response.result || []);
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
    } catch (err) {
      console.error("Failed to load units", err);
      const message =
        err instanceof UnitsApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load units.";
      setError(message);
      setUnits([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  useEffect(() => {
    const statusParam = searchParams?.get("status");
    if (!statusParam) return;

    if (statusParam === "created") {
      setSuccessMessage("Unit created successfully.");
    } else if (statusParam === "updated") {
      setSuccessMessage("Unit updated successfully.");
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("status");
    const query = nextParams.toString();
    router.replace(
      query ? `/master-data/units?${query}` : "/master-data/units",
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

  const applyFilters = () => {
    clearMessages();
    setAppliedFilters(filters);
    setPage(1);
  };

  const resetFilters = () => {
    const reset = { search: "", include_archived: false };
    setFilters(reset);
    setAppliedFilters(reset);
    setPage(1);
  };

  const handleArchiveUnit = useCallback(async (unit: Unit) => {
    setArchiveTarget(unit);
  }, []);

  const confirmArchive = useCallback(async () => {
    if (!archiveTarget) return;
    try {
      setProcessing(true);
      clearMessages();
      await unitsApi.deleteUnit(archiveTarget.id);
      setSuccessMessage("Unit archived successfully.");
      setArchiveTarget(null);
      await loadUnits();
    } catch (err) {
      console.error("Failed to archive unit", err);
      const message =
        err instanceof UnitsApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to archive unit.";
      setError(message);
      setArchiveTarget(null);
    } finally {
      setProcessing(false);
    }
  }, [archiveTarget, clearMessages, loadUnits]);

  const columns: TableColumn<Unit>[] = useMemo(
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
        className: "min-w-[120px]",
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
        key: "value",
        title: "Value",
        sortable: true,
        render: (_, record) => (
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {record.value}
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
              label: "Edit Unit",
              onClick: () =>
                router.push(`/master-data/units/${record.id}/edit`),
              icon: <Edit2 className="h-4 w-4" />,
            },
          ];

          if (!record.deleted_at) {
            actions.push({
              label: "Archive Unit",
              onClick: () => handleArchiveUnit(record),
              icon: <Archive className="h-4 w-4" />,
            });
          }

          return <ActionDropdown actions={actions} />;
        },
        className: "w-14 text-right",
      },
    ],
    [handleArchiveUnit, router],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Units
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage units of measurement for products and inventory.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            startIcon={<Filter className="h-4 w-4" />}
            onClick={applyFilters}
          >
            Apply Filters
          </Button>
          <Button
            startIcon={<Plus className="h-4 w-4" />}
            onClick={() => router.push("/master-data/units/create")}
          >
            New Unit
          </Button>
        </div>
      </div>

      {(error || successMessage) && (
        <div className="space-y-3">
          {error && <Alert variant="error" title="Error" message={error} />}
          {successMessage && (
            <Alert variant="success" title="Success" message={successMessage} />
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Label htmlFor="unit-search">Search</Label>
            <input
              id="unit-search"
              type="text"
              placeholder="Search by code or name"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
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
                  className="rounded border-gray-300 text-brand-600 shadow-sm focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900"
                />
                <span>Include Archived</span>
              </label>
            </div>
            {(filters.search !== "" || filters.include_archived) && (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Reset form filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <DataTable<Unit>
          columns={columns}
          data={units}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total: total,
            onChange: (p, ps) => handlePaginationChange(p, ps),
            showSizeChanger: true,
            serverSide: true,
          }}
          emptyText="No units found. Click 'New Unit' to get started."
        />
      </div>

      {/* Confirm Archive Modal */}
      <ConfirmModal
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={confirmArchive}
        title="Archive Unit"
        message={
          archiveTarget
            ? `Are you sure you want to archive "${archiveTarget.name}" (${archiveTarget.code})? This unit will no longer be available for use.`
            : ""
        }
        confirmLabel="Archive"
        variant="danger"
        loading={processing}
      />
    </div>
  );
}
