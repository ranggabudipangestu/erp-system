"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { coaApi, CoAApiError } from "@/lib/api/chart-of-accounts";
import { AuthService } from "@/lib/auth";
import type {
  AccountType,
  ChartOfAccountDto,
  NormalBalance,
} from "@/types/chart-of-accounts";
import {
  ACCOUNT_TYPE_LABELS,
  NORMAL_BALANCE_DEFAULT,
} from "@/types/chart-of-accounts";

interface FormState {
  code: string;
  name: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  parent_id: string;
  description: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  code: "",
  name: "",
  account_type: "ASSET",
  normal_balance: "DEBIT",
  parent_id: "",
  description: "",
  is_active: true,
};

interface ChartOfAccountFormProps {
  mode: "create" | "edit";
  accountId?: string;
  /** Pre-fill parent when adding a child account */
  defaultParentId?: string;
}

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

const ChartOfAccountForm: React.FC<ChartOfAccountFormProps> = ({
  mode,
  accountId,
  defaultParentId,
}) => {
  const router = useRouter();

  const [formState, setFormState] = useState<FormState>({
    ...emptyForm,
    parent_id: defaultParentId ?? "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [parentAccounts, setParentAccounts] = useState<ChartOfAccountDto[]>([]);

  const actor = useCallback(() => {
    const currentUser = AuthService.getCurrentUser();
    return currentUser?.email || currentUser?.name || "system";
  }, []);

  // Load eligible parent accounts (level 1 & 2 only)
  useEffect(() => {
    const loadParents = async () => {
      try {
        const { items } = await coaApi.listAccounts({ pageSize: 200 });
        setParentAccounts(items.filter((a) => a.level < 3 && a.is_active));
      } catch {
        // non-critical
      }
    };
    loadParents();
  }, []);

  // Load existing account in edit mode
  useEffect(() => {
    if (mode !== "edit" || !accountId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const account = await coaApi.getAccount(accountId);
        setFormState({
          code: account.code,
          name: account.name,
          account_type: account.account_type,
          normal_balance: account.normal_balance,
          parent_id: account.parent_id ?? "",
          description: account.description ?? "",
          is_active: account.is_active,
        });
      } catch (err) {
        const message =
          err instanceof CoAApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load account.";
        setFormError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accountId, mode]);

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setFormState((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-suggest normal_balance when account_type changes
      if (field === "account_type") {
        next.normal_balance = NORMAL_BALANCE_DEFAULT[value as AccountType];
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formState.code.trim() || !formState.name.trim()) {
      setFormError("Code and Name are required.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const base = {
        code: formState.code.trim(),
        name: formState.name.trim(),
        account_type: formState.account_type,
        normal_balance: formState.normal_balance,
        parent_id: formState.parent_id || null,
        description: formState.description.trim() || null,
        is_active: formState.is_active,
      };
      if (mode === "create") {
        await coaApi.createAccount({ ...base, created_by: actor() });
        router.push("/master-data/chart-of-accounts?status=created");
      } else if (accountId) {
        await coaApi.updateAccount(accountId, { ...base, updated_by: actor() });
        router.push("/master-data/chart-of-accounts?status=updated");
      }
    } catch (err) {
      const message =
        err instanceof CoAApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to save account.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const pageTitle = mode === "create" ? "Add Account" : "Edit Account";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/master-data/chart-of-accounts"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chart of Accounts
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {mode === "create"
              ? "Create a new account in the Chart of Accounts."
              : "Update account information."}
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
              {/* Code */}
              <div>
                <Label htmlFor="coa-code">
                  Account Code<span className="text-error-500">*</span>
                </Label>
                <input
                  id="coa-code"
                  value={formState.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  placeholder="e.g. 1110"
                  required
                  className={inputClass}
                />
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="coa-name">
                  Account Name<span className="text-error-500">*</span>
                </Label>
                <input
                  id="coa-name"
                  value={formState.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Cash"
                  required
                  className={inputClass}
                />
              </div>

              {/* Account Type */}
              <div>
                <Label htmlFor="coa-account-type">
                  Account Type<span className="text-error-500">*</span>
                </Label>
                <select
                  id="coa-account-type"
                  value={formState.account_type}
                  onChange={(e) =>
                    handleChange("account_type", e.target.value as AccountType)
                  }
                  className={inputClass}
                >
                  {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map(
                    (type) => (
                      <option key={type} value={type}>
                        {ACCOUNT_TYPE_LABELS[type]}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Normal Balance */}
              <div>
                <Label htmlFor="coa-normal-balance">
                  Normal Balance<span className="text-error-500">*</span>
                </Label>
                <select
                  id="coa-normal-balance"
                  value={formState.normal_balance}
                  onChange={(e) =>
                    handleChange(
                      "normal_balance",
                      e.target.value as NormalBalance,
                    )
                  }
                  className={inputClass}
                >
                  <option value="DEBIT">Debit</option>
                  <option value="CREDIT">Credit</option>
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Auto-suggested based on account type, can be changed.
                </p>
              </div>

              {/* Parent Account */}
              <div className="md:col-span-2">
                <Label htmlFor="coa-parent">Parent Account (Optional)</Label>
                <select
                  id="coa-parent"
                  value={formState.parent_id}
                  onChange={(e) => handleChange("parent_id", e.target.value)}
                  className={inputClass}
                >
                  <option value="">— None (root level 1 account) —</option>
                  {parentAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {"  ".repeat(acc.level - 1)}
                      {acc.code} — {acc.name} (Level {acc.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Label htmlFor="coa-description">Description</Label>
                <textarea
                  id="coa-description"
                  rows={3}
                  value={formState.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Optional description for this account"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Is Active */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.is_active}
                    onChange={(e) =>
                      handleChange("is_active", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Active Account
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/master-data/chart-of-accounts")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : mode === "create"
                    ? "Create Account"
                    : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChartOfAccountForm;
