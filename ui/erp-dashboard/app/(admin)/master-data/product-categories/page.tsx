"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RefreshCw, Search, X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import CategoryTreeTable from "@/components/master-data/product-categories/CategoryTreeTable";
import {
  productCategoriesApi,
  ProductCategoriesApiError,
} from "@/lib/api/productCategories";
import type { ProductCategoryTree } from "@/types/productCategories";

/** Recursively filter tree: keep node if itself or any descendant matches */
function filterTree(
  nodes: ProductCategoryTree[],
  searchLower: string,
): ProductCategoryTree[] {
  return nodes.reduce<ProductCategoryTree[]>((acc, node) => {
    const filteredChildren = filterTree(node.children, searchLower);

    const selfMatches =
      !searchLower ||
      node.code.toLowerCase().includes(searchLower) ||
      node.name.toLowerCase().includes(searchLower);

    if (selfMatches || filteredChildren.length > 0) {
      acc.push({ ...node, children: filteredChildren });
    }
    return acc;
  }, []);
}

const inputClass =
  "h-10 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function ProductCategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tree, setTree] = useState<ProductCategoryTree[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [archiveTarget, setArchiveTarget] =
    useState<ProductCategoryTree | null>(null);

  const loadTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { result } = await productCategoriesApi.getTree();
      setTree(result || []);
    } catch (err) {
      const message =
        err instanceof ProductCategoriesApiError
          ? err.message
          : "Failed to load categories.";
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
      setSuccessMessage("Product category created successfully.");
    else if (status === "updated")
      setSuccessMessage("Product category updated successfully.");

    const next = new URLSearchParams(searchParams.toString());
    next.delete("status");
    const query = next.toString();
    router.replace(
      query
        ? `/master-data/product-categories?${query}`
        : "/master-data/product-categories",
      { scroll: false },
    );
  }, [router, searchParams]);

  const handleEdit = (category: ProductCategoryTree) => {
    router.push(`/master-data/product-categories/${category.id}/edit`);
  };

  const handleArchive = useCallback(async (category: ProductCategoryTree) => {
    setArchiveTarget(category);
  }, []);

  const confirmArchive = useCallback(async () => {
    if (!archiveTarget) return;
    try {
      setProcessing(true);
      setError(null);
      await productCategoriesApi.deleteCategory(archiveTarget.id);
      setSuccessMessage(
        `Category "${archiveTarget.name}" archived successfully.`,
      );
      setArchiveTarget(null);
      await loadTree();
    } catch (err) {
      const message =
        err instanceof ProductCategoriesApiError
          ? err.message
          : "Failed to archive category.";
      setError(message);
      setArchiveTarget(null);
    } finally {
      setProcessing(false);
    }
  }, [archiveTarget, loadTree]);

  const handleAddChild = (parent: ProductCategoryTree) => {
    router.push(
      `/master-data/product-categories/create?parent_id=${parent.id}`,
    );
  };

  const filteredTree = useMemo(() => {
    if (!searchQuery) return tree;
    return filterTree(tree, searchQuery.toLowerCase().trim());
  }, [tree, searchQuery]);

  const countAll = (nodes: ProductCategoryTree[]): number =>
    nodes.reduce((acc, n) => acc + 1 + countAll(n.children), 0);
  const totalCategories = countAll(tree);
  const filteredCount = countAll(filteredTree);
  const isFiltered = !!searchQuery;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Product Categories
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage product categories with hierarchy support.
            {!loading && (
              <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                {isFiltered
                  ? `${filteredCount} / ${totalCategories} categories`
                  : `${totalCategories} categories`}
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
            onClick={() =>
              router.push("/master-data/product-categories/create")
            }
          >
            New Category
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            id="category-search"
            type="text"
            placeholder="Search by code or category name..."
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

        {isFiltered && (
          <button
            onClick={() => setSearchQuery("")}
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

      {/* Tree Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <CategoryTreeTable
          data={filteredTree}
          loading={loading}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onAddChild={handleAddChild}
        />

        {!loading && isFiltered && filteredCount === 0 && tree.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm">
            <p>No categories match the current search.</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              Reset search
            </button>
          </div>
        )}
      </div>

      {/* Confirm Archive Modal */}
      <ConfirmModal
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={confirmArchive}
        title="Archive Category"
        message={
          archiveTarget
            ? `Are you sure you want to archive "${archiveTarget.name}" (${archiveTarget.code})? This category will no longer be available for use.`
            : ""
        }
        confirmLabel="Archive"
        variant="danger"
        loading={processing}
      />
    </div>
  );
}
