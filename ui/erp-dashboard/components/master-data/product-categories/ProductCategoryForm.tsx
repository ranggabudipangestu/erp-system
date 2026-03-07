"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import {
  productCategoriesApi,
  ProductCategoriesApiError,
} from "@/lib/api/productCategories";
import type {
  ProductCategory,
  ProductCategoryCreateRequest,
  ProductCategoryUpdateRequest,
} from "@/types/productCategories";

interface FormState {
  code: string;
  name: string;
  description: string;
  parent_id: string;
}

const emptyForm: FormState = {
  code: "",
  name: "",
  description: "",
  parent_id: "",
};

interface ProductCategoryFormProps {
  mode: "create" | "edit";
  categoryId?: string;
  defaultParentId?: string;
}

const ProductCategoryForm: React.FC<ProductCategoryFormProps> = ({
  mode,
  categoryId,
  defaultParentId,
}) => {
  const router = useRouter();

  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [parentOptions, setParentOptions] = useState<ProductCategory[]>([]);

  // Load parent category options
  useEffect(() => {
    const loadParents = async () => {
      try {
        const { result } = await productCategoriesApi.getCategories({
          page_size: 100,
        });
        setParentOptions(result || []);
      } catch (err) {
        console.error("Failed to load parent categories", err);
      }
    };
    loadParents();
  }, []);

  // Load existing category when editing
  useEffect(() => {
    if (mode !== "edit" || !categoryId) {
      setFormState({ ...emptyForm, parent_id: defaultParentId || "" });
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setFormError(null);
        const { result: category } =
          await productCategoriesApi.getCategory(categoryId);
        if (category) {
          setFormState({
            code: category.code || "",
            name: category.name || "",
            description: category.description || "",
            parent_id: category.parent_id || "",
          });
        }
      } catch (err) {
        console.error("Failed to load category", err);
        const message =
          err instanceof ProductCategoriesApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load category.";
        setFormError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [categoryId, mode]);

  const handleFormChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = ():
    | ProductCategoryCreateRequest
    | ProductCategoryUpdateRequest => {
    if (!formState.code.trim() || !formState.name.trim()) {
      throw new Error("Code and Name are required");
    }

    return {
      code: formState.code.trim(),
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
      parent_id: formState.parent_id || null,
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      const payload = buildPayload();
      setSubmitting(true);

      if (mode === "create") {
        await productCategoriesApi.createCategory(payload);
        router.push("/master-data/product-categories?status=created");
      } else if (mode === "edit" && categoryId) {
        await productCategoriesApi.updateCategory(categoryId, payload);
        router.push("/master-data/product-categories?status=updated");
      }
    } catch (err) {
      console.error("Failed to submit category form", err);
      const message =
        err instanceof ProductCategoriesApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to save category.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const pageTitle = useMemo(
    () =>
      mode === "create" ? "Create Product Category" : "Edit Product Category",
    [mode],
  );

  // Filter parent options: exclude self when editing
  const availableParents = useMemo(
    () => parentOptions.filter((p) => p.id !== categoryId && !p.deleted_at),
    [parentOptions, categoryId],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/master-data/product-categories"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Product Categories
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {pageTitle}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {mode === "create"
              ? "Create a new product category."
              : "Update product category details."}
          </p>
        </div>

        {formError && (
          <Alert variant="error" title="Error" message={formError} />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="category-code">
                  Code<span className="text-error-500">*</span>
                </Label>
                <input
                  id="category-code"
                  value={formState.code}
                  onChange={(e) => handleFormChange("code", e.target.value)}
                  required
                  placeholder="e.g. ELEC, FOOD"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="category-name">
                  Name<span className="text-error-500">*</span>
                </Label>
                <input
                  id="category-name"
                  value={formState.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  required
                  placeholder="e.g. Electronics, Food"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="category-parent">Parent Category</Label>
                <select
                  id="category-parent"
                  value={formState.parent_id}
                  onChange={(e) =>
                    handleFormChange("parent_id", e.target.value)
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white lg:w-1/2"
                >
                  <option value="">— None (Top Level) —</option>
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.code} — {parent.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave empty for a top-level category, or select a parent to
                  create a sub-category.
                </p>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="category-description">Description</Label>
                <textarea
                  id="category-description"
                  value={formState.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-800 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/master-data/product-categories")}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Category"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProductCategoryForm;
