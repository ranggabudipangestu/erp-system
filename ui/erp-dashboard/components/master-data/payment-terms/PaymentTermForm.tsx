'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import { paymentTermsApi, PaymentTermsApiError } from '@/lib/api/payment-terms';
import { AuthService } from '@/lib/auth';
import type {
  PaymentTermCreateRequest,
  PaymentTermUpdateRequest,
} from '@/types/payment-terms';

interface PaymentTermFormState {
  code: string;
  name: string;
  description: string;
  due_days: string;
  early_payment_discount_percent: string;
  early_payment_discount_days: string;
}

const emptyForm: PaymentTermFormState = {
  code: '',
  name: '',
  description: '',
  due_days: '',
  early_payment_discount_percent: '',
  early_payment_discount_days: '',
};

interface PaymentTermFormProps {
  mode: 'create' | 'edit';
  paymentTermId?: string;
}

const PaymentTermForm: React.FC<PaymentTermFormProps> = ({ mode, paymentTermId }) => {
  const router = useRouter();

  const [formState, setFormState] = useState<PaymentTermFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);

  const actor = useCallback(() => {
    const currentUser = AuthService.getCurrentUser();
    return currentUser?.email || currentUser?.name || 'system';
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !paymentTermId) {
      setFormState(emptyForm);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setFormError(null);
        const paymentTerm = await paymentTermsApi.getPaymentTerm(paymentTermId);
        const initial: PaymentTermFormState = {
          code: paymentTerm.code || '',
          name: paymentTerm.name || '',
          description: paymentTerm.description || '',
          due_days: String(paymentTerm.due_days || ''),
          early_payment_discount_percent: paymentTerm.early_payment_discount_percent != null ? String(paymentTerm.early_payment_discount_percent) : '',
          early_payment_discount_days: paymentTerm.early_payment_discount_days != null ? String(paymentTerm.early_payment_discount_days) : '',
        };
        setFormState(initial);
      } catch (err) {
        console.error('Failed to load payment term', err);
        const message = err instanceof PaymentTermsApiError ? err.message : err instanceof Error ? err.message : 'Failed to load payment term.';
        setFormError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [paymentTermId, mode]);

  const handleFormChange = (field: keyof PaymentTermFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const parseOptionalNumber = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      throw new Error('Must be a valid number');
    }
    return parsed;
  };

  const parseRequiredNumber = (value: string): number => {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error('This field is required');
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      throw new Error('Must be a valid number');
    }
    return parsed;
  };

  const validateDiscountFields = (discountPercent: string, discountDays: string): void => {
    const hasPercent = discountPercent.trim() !== '';
    const hasDays = discountDays.trim() !== '';

    if (hasPercent && !hasDays) {
      throw new Error('Early payment discount days must be specified when discount percent is provided');
    }
    if (!hasPercent && hasDays) {
      throw new Error('Early payment discount percent must be specified when discount days are provided');
    }
  };

  const buildPayload = (): Omit<PaymentTermCreateRequest, 'created_by'> => {
    if (!formState.code.trim() || !formState.name.trim()) {
      throw new Error('Code and Name are required');
    }

    validateDiscountFields(formState.early_payment_discount_percent, formState.early_payment_discount_days);

    return {
      code: formState.code.trim(),
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
      due_days: parseRequiredNumber(formState.due_days),
      early_payment_discount_percent: parseOptionalNumber(formState.early_payment_discount_percent),
      early_payment_discount_days: parseOptionalNumber(formState.early_payment_discount_days),
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      const basePayload = buildPayload();
      const userActor = actor();
      setSubmitting(true);

      if (mode === 'create') {
        const payload: PaymentTermCreateRequest = { ...basePayload, created_by: userActor };
        await paymentTermsApi.createPaymentTerm(payload);
        router.push('/master-data/payment-terms?status=created');
      } else if (mode === 'edit' && paymentTermId) {
        const payload: PaymentTermUpdateRequest = { ...basePayload, updated_by: userActor };
        await paymentTermsApi.updatePaymentTerm(paymentTermId, payload);
        router.push('/master-data/payment-terms?status=updated');
      }
    } catch (err) {
      console.error('Failed to submit payment term form', err);
      const message = err instanceof PaymentTermsApiError ? err.message : err instanceof Error ? err.message : 'Failed to save payment term.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const pageTitle = useMemo(
    () => (mode === 'create' ? 'Create Payment Term' : 'Edit Payment Term'),
    [mode],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/master-data/payment-terms"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payment Terms
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{pageTitle}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {mode === 'create'
              ? 'Create a new payment term with due days and early payment discount settings.'
              : 'Update payment term details, due days, and discount settings.'}
          </p>
        </div>

        {formError && <Alert variant="error" title="Error" message={formError} />}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="payment-term-code">Code<span className="text-error-500">*</span></Label>
                <input
                  id="payment-term-code"
                  value={formState.code}
                  onChange={(e) => handleFormChange('code', e.target.value)}
                  required
                  placeholder="e.g. NET30"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="payment-term-name">Name<span className="text-error-500">*</span></Label>
                <input
                  id="payment-term-name"
                  value={formState.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                  placeholder="e.g. Net 30 Days"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="payment-term-due-days">Due Days<span className="text-error-500">*</span></Label>
                <input
                  id="payment-term-due-days"
                  type="number"
                  value={formState.due_days}
                  onChange={(e) => handleFormChange('due_days', e.target.value)}
                  required
                  placeholder="e.g. 30"
                  min="1"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="payment-term-discount-percent">Early Payment Discount %</Label>
                <input
                  id="payment-term-discount-percent"
                  type="number"
                  value={formState.early_payment_discount_percent}
                  onChange={(e) => handleFormChange('early_payment_discount_percent', e.target.value)}
                  placeholder="e.g. 2"
                  min="0"
                  max="100"
                  step="0.01"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="payment-term-discount-days">Early Payment Discount Days</Label>
                <input
                  id="payment-term-discount-days"
                  type="number"
                  value={formState.early_payment_discount_days}
                  onChange={(e) => handleFormChange('early_payment_discount_days', e.target.value)}
                  placeholder="e.g. 10"
                  min="1"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="payment-term-description">Description</Label>
              <textarea
                id="payment-term-description"
                rows={3}
                value={formState.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Optional description of the payment term"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Payment Term Summary</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>• Payment due in {formState.due_days || '___'} days from invoice date</p>
                {formState.early_payment_discount_percent && formState.early_payment_discount_days ? (
                  <p>• {formState.early_payment_discount_percent}% discount if paid within {formState.early_payment_discount_days} days</p>
                ) : (
                  <p>• No early payment discount</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => router.push('/master-data/payment-terms')}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : mode === 'create' ? 'Create Payment Term' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentTermForm;