"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";

import { currenciesApi } from "@/lib/api/master-data/currencies";
import type {
  CurrencyCreatePayload,
  CurrencyUpdatePayload,
} from "@/types/currencies";

interface CurrencyFormState {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: string;
}

const emptyForm: CurrencyFormState = {
  code: "",
  name: "",
  symbol: "",
  exchange_rate: "1",
};

interface CurrencyFormProps {
  mode: "create" | "edit";
  currencyId?: string;
}

const CurrencyForm: React.FC<CurrencyFormProps> = ({ mode, currencyId }) => {
  const router = useRouter();

  const [formState, setFormState] = useState<CurrencyFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(mode === "edit");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !currencyId) {
      setFormState(emptyForm);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setFormError(null);
        const { result: currency } = await currenciesApi.get(currencyId);
        if (currency) {
          setFormState({
            code: currency.code || "",
            name: currency.name || "",
            symbol: currency.symbol || "",
            exchange_rate:
              currency.exchange_rate != null
                ? String(currency.exchange_rate)
                : "1",
          });
        }
      } catch (err: any) {
        console.error("Failed to load currency", err);
        setFormError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load currency. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [mode, currencyId]);

  const validate = (): boolean => {
    if (
      !formState.code.trim() ||
      !formState.name.trim() ||
      !formState.symbol.trim() ||
      !formState.exchange_rate
    ) {
      setFormError("All fields marked with * are required.");
      return false;
    }

    if (
      isNaN(Number(formState.exchange_rate)) ||
      Number(formState.exchange_rate) <= 0
    ) {
      setFormError("Exchange rate must be a positive number.");
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        code: formState.code.trim(),
        name: formState.name.trim(),
        symbol: formState.symbol.trim(),
        exchange_rate: Number(formState.exchange_rate),
      };

      if (mode === "create") {
        await currenciesApi.create(payload as CurrencyCreatePayload);
      } else if (mode === "edit" && currencyId) {
        await currenciesApi.update(
          currencyId,
          payload as CurrencyUpdatePayload,
        );
      }

      router.push("/master-data/currencies");
      router.refresh(); // Refresh the list view
    } catch (err: any) {
      console.error("Submit currency error:", err);
      setFormError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save currency. Please check your data.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="text-gray-500">Loading form...</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Create New Currency" : "Edit Currency"}
        </h2>
        <Link
          href="/master-data/currencies"
          className="flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <Alert variant="error" title="Validation Error" message={formError} />
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Default form spacing */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="code" className="mb-1.5 block">
                Code <span className="text-error-500">*</span>
              </Label>
              <input
                autoFocus
                type="text"
                id="code"
                name="code"
                placeholder="Ex: IDR"
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 outline-none transition hover:border-brand-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90 dark:hover:border-brand-500 dark:focus:border-brand-500"
                value={formState.code}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-1.5 block">
                Name <span className="text-error-500">*</span>
              </Label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Ex: Indonesian Rupiah"
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 outline-none transition hover:border-brand-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90 dark:hover:border-brand-500 dark:focus:border-brand-500"
                value={formState.name}
                onChange={(e) =>
                  setFormState((p) => ({ ...p, name: e.target.value }))
                }
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="symbol" className="mb-1.5 block">
                Symbol <span className="text-error-500">*</span>
              </Label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                placeholder="Ex: Rp"
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 outline-none transition hover:border-brand-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90 dark:hover:border-brand-500 dark:focus:border-brand-500"
                value={formState.symbol}
                onChange={(e) =>
                  setFormState((p) => ({ ...p, symbol: e.target.value }))
                }
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="exchange_rate" className="mb-1.5 block">
                Exchange Rate <span className="text-error-500">*</span>
                <span className="ml-1 text-xs text-gray-500">
                  (relative to base currency)
                </span>
              </Label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                id="exchange_rate"
                name="exchange_rate"
                placeholder="1.0000"
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 outline-none transition hover:border-brand-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90 dark:hover:border-brand-500 dark:focus:border-brand-500"
                value={formState.exchange_rate}
                onChange={(e) =>
                  setFormState((p) => ({ ...p, exchange_rate: e.target.value }))
                }
                disabled={submitting}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/master-data/currencies")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Saving..."
              : mode === "create"
                ? "Create Currency"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CurrencyForm;
