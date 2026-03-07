"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RefreshCw, Search, X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useDebounce } from "@/hooks/useDebounce";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import CoATreeTable from "@/components/master-data/chart-of-accounts/CoATreeTable";
import { coaApi, CoAApiError } from "@/lib/api/chart-of-accounts";
import type {
  ChartOfAccountTreeDto,
  AccountType,
} from "@/types/chart-of-accounts";
import { ACCOUNT_TYPE_LABELS } from "@/types/chart-of-accounts";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

/** Recursively filter tree: keep node if itself or any descendant matches */
function filterTree(
  nodes: ChartOfAccountTreeDto[],
  searchLower: string,
  accountType: AccountType | "",
): ChartOfAccountTreeDto[] {
  return nodes.reduce<ChartOfAccountTreeDto[]>((acc, node) => {
    const filteredChildren = filterTree(
      node.children,
      searchLower,
      accountType,
    );

    const selfMatchesSearch =
      !searchLower ||
      node.code.toLowerCase().includes(searchLower) ||
      node.name.toLowerCase().includes(searchLower);

    const selfMatchesType = !accountType || node.account_type === accountType;

    if ((selfMatchesSearch && selfMatchesType) || filteredChildren.length > 0) {
      acc.push({ ...node, children: filteredChildren });
    }
    return acc;
  }, []);
}

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tree, setTree] = useState<ChartOfAccountTreeDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [filterType, setFilterType] = useState<AccountType | "">("");
  const [archiveTarget, setArchiveTarget] =
    useState<ChartOfAccountTreeDto | null>(null);

  const loadTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await coaApi.getTree();
      setTree(data);
    } catch (err) {
      const message =
        err instanceof CoAApiError ? err.message : "Failed to load accounts.";
      setError(message);
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    const status = searchParams?.get("status");
    if (!status) return;
    if (status === "created")
      setSuccessMessage("Account created successfully.");
    else if (status === "updated")
      setSuccessMessage("Account updated successfully.");

    const next = new URLSearchParams(searchParams.toString());
    next.delete("status");
    const query = next.toString();
    router.replace(
      query
        ? `/master-data/chart-of-accounts?${query}`
        : "/master-data/chart-of-accounts",
      { scroll: false },
    );
  }, [router, searchParams]);

  const handleEdit = (account: ChartOfAccountTreeDto) => {
    router.push(`/master-data/chart-of-accounts/${account.id}/edit`);
  };

  const handleArchive = useCallback(async (account: ChartOfAccountTreeDto) => {
    setArchiveTarget(account);
  }, []);

  const confirmArchive = useCallback(async () => {
    if (!archiveTarget) return;
    try {
      setProcessing(true);
      setError(null);
      await coaApi.archiveAccount(archiveTarget.id);
      setSuccessMessage(
        `Account "${archiveTarget.name}" archived successfully.`,
      );
      setArchiveTarget(null);
      await loadTree();
    } catch (err) {
      const message =
        err instanceof CoAApiError ? err.message : "Failed to archive account.";
      setError(message);
      setArchiveTarget(null);
    } finally {
      setProcessing(false);
    }
  }, [archiveTarget, loadTree]);

  const handleAddChild = (parent: ChartOfAccountTreeDto) => {
    router.push(`/master-data/chart-of-accounts/create?parent_id=${parent.id}`);
  };

  const filteredTree = useMemo(() => {
    if (!debouncedSearch && !filterType) return tree;
    return filterTree(tree, debouncedSearch.toLowerCase().trim(), filterType);
  }, [tree, debouncedSearch, filterType]);

  const countAll = (nodes: ChartOfAccountTreeDto[]): number =>
    nodes.reduce((acc, n) => acc + 1 + countAll(n.children), 0);
  const totalAccounts = countAll(tree);
  const filteredCount = countAll(filteredTree);
  const isFiltered = searchQuery || filterType;

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Chart of Accounts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage financial accounts with a 3-level hierarchy.
            {!loading && (
              <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                {isFiltered
                  ? `${filteredCount} / ${totalAccounts} accounts`
                  : `${totalAccounts} accounts`}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            startIcon={
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            }
            onClick={loadTree}
            disabled={loading || processing}
          >
            Refresh
          </Button>
          <Button
            startIcon={<Plus className="h-4 w-4" />}
            onClick={() => router.push("/master-data/chart-of-accounts/create")}
          >
            Add Account
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            id="coa-search"
            type="text"
            placeholder="Search by code or account name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${inputClass} !pl-10`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          id="coa-filter-type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as AccountType | "")}
          className={`${inputClass} max-w-[200px]`}
        >
          <option value="">All Types</option>
          {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((type) => (
            <option key={type} value={type}>
              {ACCOUNT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>

        {isFiltered && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 whitespace-nowrap"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Alerts */}
      {(error || successMessage) && (
        <div className="space-y-2">
          {error && <Alert variant="error" title="Error" message={error} />}
          {successMessage && (
            <Alert variant="success" title="Success" message={successMessage} />
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((type) => {
          const colors: Record<AccountType, string> = {
            ASSET: "bg-blue-100 text-blue-700",
            LIABILITY: "bg-red-100 text-red-700",
            EQUITY: "bg-purple-100 text-purple-700",
            REVENUE: "bg-green-100 text-green-700",
            EXPENSE: "bg-orange-100 text-orange-700",
          };
          return (
            <button
              key={type}
              onClick={() =>
                setFilterType((prev) => (prev === type ? "" : type))
              }
              className={`px-2 py-0.5 rounded-full font-medium transition-all cursor-pointer ${colors[type]} ${
                filterType === type
                  ? "ring-2 ring-offset-1 ring-gray-400"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              {ACCOUNT_TYPE_LABELS[type]}
            </button>
          );
        })}
      </div>

      {/* Tree Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <CoATreeTable
          data={filteredTree}
          loading={loading}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onAddChild={handleAddChild}
        />

        {!loading && isFiltered && filteredCount === 0 && tree.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm">
            <p>No accounts match the current filters.</p>
            <button
              onClick={clearFilters}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Confirm Archive Modal */}
      <ConfirmModal
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={confirmArchive}
        title="Archive Account"
        message={
          archiveTarget
            ? `Are you sure you want to archive "${archiveTarget.name}" (${archiveTarget.code})? This account will no longer be available.`
            : ""
        }
        confirmLabel="Archive"
        variant="danger"
        loading={processing}
      />
    </div>
  );
}
