"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { unitsApi, UnitsApiError } from "@/lib/api/units";
import type { UnitCreateRequest, UnitUpdateRequest } from "@/types/units";

interface UnitFormState {
  code: string;
  name: string;
  value: string;
}

const emptyForm: UnitFormState = {
  code: "",
  name: "",
  value: "1",
};

interface UnitFormProps {
  mode: "create" | "edit";
  unitId?: string;
}

const UnitForm: React.FC<UnitFormProps> = ({ mode, unitId }) => {
  const router = useRouter();

  const [formState, setFormState] = useState<UnitFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(mode === "edit");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !unitId) {
      setFormState(emptyForm);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setFormError(null);
        const { result: unit } = await unitsApi.getUnit(unitId);
        if (unit) {
          setFormState({
            code: unit.code || "",
            name: unit.name || "",
            value: unit.value != null ? String(unit.value) : "1",
          });
        }
      } catch (err) {
        console.error("Failed to load unit", err);
        const message =
          err instanceof UnitsApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load unit.";
        setFormError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [unitId, mode]);

  const handleFormChange = (field: keyof UnitFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = (): UnitCreateRequest | UnitUpdateRequest => {
    if (!formState.code.trim() || !formState.name.trim()) {
      throw new Error("Code and Name are required");
    }

    const numericValue = parseFloat(formState.value);
    if (isNaN(numericValue) || numericValue < 0) {
      throw new Error("Value must be a valid positive number");
    }

    return {
      code: formState.code.trim(),
      name: formState.name.trim(),
      value: numericValue,
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      const payload = buildPayload();
      setSubmitting(true);

      if (mode === "create") {
        await unitsApi.createUnit(payload);
        router.push("/master-data/units?status=created");
      } else if (mode === "edit" && unitId) {
        await unitsApi.updateUnit(unitId, payload);
        router.push("/master-data/units?status=updated");
      }
    } catch (err) {
      console.error("Failed to submit unit form", err);
      const message =
        err instanceof UnitsApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to save unit.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const pageTitle = useMemo(
    () => (mode === "create" ? "Create Unit" : "Edit Unit"),
    [mode],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/master-data/units"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Units
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {pageTitle}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {mode === "create"
              ? "Create a new unit of measurement."
              : "Update unit of measurement details."}
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
                <Label htmlFor="unit-code">
                  Code<span className="text-error-500">*</span>
                </Label>
                <input
                  id="unit-code"
                  value={formState.code}
                  onChange={(e) => handleFormChange("code", e.target.value)}
                  required
                  placeholder="e.g. PCS, BOX40"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="unit-name">
                  Name<span className="text-error-500">*</span>
                </Label>
                <input
                  id="unit-name"
                  value={formState.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  required
                  placeholder="e.g. Pieces, Box 40"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="unit-value">
                  Value<span className="text-error-500">*</span>
                </Label>
                <input
                  id="unit-value"
                  type="number"
                  step="any"
                  min="0"
                  value={formState.value}
                  onChange={(e) => handleFormChange("value", e.target.value)}
                  required
                  placeholder="e.g. 1 for PCS, 40 for BOX40"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white lg:w-1/2"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  The quantity this unit represents. For example, 1 BOX40 = 40
                  PCS, so BOX40 has a value of 40.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-800 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/master-data/units")}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Unit"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UnitForm;
