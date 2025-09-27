'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import { contactsApi, ContactsApiError } from '@/lib/api/contacts';
import { AuthService } from '@/lib/auth';
import type {
  ContactCreateRequest,
  ContactRole,
  ContactStatus,
  ContactUpdateRequest,
} from '@/types/contacts';

const ROLE_OPTIONS: ContactRole[] = ['Customer', 'Supplier', 'Employee'];
const STATUS_OPTIONS: ContactStatus[] = ['Active', 'Archived'];

interface ContactFormState {
  code: string;
  name: string;
  email: string;
  phone: string;
  address_billing: string;
  address_shipping: string;
  tax_number: string;
  roles: ContactRole[];
  credit_limit: string;
  distribution_channel: string;
  pic_name: string;
  bank_account_number: string;
  payment_terms: string;
  sales_contact_name: string;
  employee_id: string;
  department: string;
  job_title: string;
  employment_status: string;
}

const emptyForm: ContactFormState = {
  code: '',
  name: '',
  email: '',
  phone: '',
  address_billing: '',
  address_shipping: '',
  tax_number: '',
  roles: ['Customer'],
  credit_limit: '',
  distribution_channel: '',
  pic_name: '',
  bank_account_number: '',
  payment_terms: '',
  sales_contact_name: '',
  employee_id: '',
  department: '',
  job_title: '',
  employment_status: '',
};

interface ContactFormProps {
  mode: 'create' | 'edit';
  contactId?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ mode, contactId }) => {
  const router = useRouter();

  const [formState, setFormState] = useState<ContactFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);

  const actor = useCallback(() => {
    const currentUser = AuthService.getCurrentUser();
    return currentUser?.email || currentUser?.name || 'system';
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !contactId) {
      setFormState(emptyForm);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setFormError(null);
        const contact = await contactsApi.getContact(contactId);
        const initial: ContactFormState = {
          code: contact.code || '',
          name: contact.name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          address_billing: contact.address_billing || '',
          address_shipping: contact.address_shipping || '',
          tax_number: contact.tax_number || '',
          roles: contact.roles && contact.roles.length ? (contact.roles as ContactRole[]) : ['Customer'],
          // status: (contact.status as ContactStatus) || 'Active',
          credit_limit: contact.credit_limit != null ? String(contact.credit_limit) : '',
          distribution_channel: contact.distribution_channel || '',
          pic_name: contact.pic_name || '',
          bank_account_number: contact.bank_account_number || '',
          payment_terms: contact.payment_terms || '',
          sales_contact_name: contact.sales_contact_name || '',
          employee_id: contact.employee_id || '',
          department: contact.department || '',
          job_title: contact.job_title || '',
          employment_status: contact.employment_status || '',
        };
        setFormState(initial);
      } catch (err) {
        console.error('Failed to load contact', err);
        const message = err instanceof ContactsApiError ? err.message : err instanceof Error ? err.message : 'Failed to load contact.';
        setFormError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [contactId, mode]);

  const handleFormChange = (field: keyof ContactFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRoleSelection = (role: ContactRole) => {
    setFormState((prev) => {
      const hasRole = prev.roles.includes(role);
      const nextRoles = hasRole ? prev.roles.filter((item) => item !== role) : [...prev.roles, role];
      return {
        ...prev,
        roles: nextRoles,
      };
    });
  };

  const parseOptionalNumber = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      throw new Error('Credit limit must be a valid number');
    }
    return parsed;
  };

  const buildPayload = (): Omit<ContactCreateRequest, 'created_by'> => {
    if (!formState.code.trim() || !formState.name.trim()) {
      throw new Error('Code and Name are required');
    }
    if (formState.roles.length === 0) {
      throw new Error('Select at least one role');
    }

    return {
      code: formState.code.trim(),
      name: formState.name.trim(),
      email: formState.email.trim() || undefined,
      phone: formState.phone.trim() || undefined,
      address_billing: formState.address_billing.trim() || undefined,
      address_shipping: formState.address_shipping.trim() || undefined,
      tax_number: formState.tax_number.trim() || undefined,
      roles: Array.from(new Set(formState.roles)) as ContactRole[],
      credit_limit: parseOptionalNumber(formState.credit_limit),
      distribution_channel: formState.distribution_channel.trim() || undefined,
      pic_name: formState.pic_name.trim() || undefined,
      bank_account_number: formState.bank_account_number.trim() || undefined,
      payment_terms: formState.payment_terms.trim() || undefined,
      sales_contact_name: formState.sales_contact_name.trim() || undefined,
      employee_id: formState.employee_id.trim() || undefined,
      department: formState.department.trim() || undefined,
      job_title: formState.job_title.trim() || undefined,
      employment_status: formState.employment_status.trim() || undefined,
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
        const payload: ContactCreateRequest = { ...basePayload, created_by: userActor };
        await contactsApi.createContact(payload);
        router.push('/master-data/contacts?status=created');
      } else if (mode === 'edit' && contactId) {
        const payload: ContactUpdateRequest = { ...basePayload, updated_by: userActor };
        await contactsApi.updateContact(contactId, payload);
        router.push('/master-data/contacts?status=updated');
      }
    } catch (err) {
      console.error('Failed to submit contact form', err);
      const message = err instanceof ContactsApiError ? err.message : err instanceof Error ? err.message : 'Failed to save contact.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const pageTitle = useMemo(
    () => (mode === 'create' ? 'Create Contact' : 'Edit Contact'),
    [mode],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/master-data/contacts"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{pageTitle}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {mode === 'create'
              ? 'Create a new contact record and assign relevant roles.'
              : 'Update contact details, roles, and status.'}
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
                <Label htmlFor="contact-code">Code<span className="text-error-500">*</span></Label>
                <input
                  id="contact-code"
                  value={formState.code}
                  onChange={(e) => handleFormChange('code', e.target.value)}
                  required
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="contact-name">Name<span className="text-error-500">*</span></Label>
                <input
                  id="contact-name"
                  value={formState.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="contact-email">Email</Label>
                <input
                  id="contact-email"
                  type="email"
                  value={formState.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="contact-phone">Phone</Label>
                <input
                  id="contact-phone"
                  value={formState.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="contact-credit">Credit Limit</Label>
                <input
                  id="contact-credit"
                  value={formState.credit_limit}
                  onChange={(e) => handleFormChange('credit_limit', e.target.value)}
                  placeholder="e.g. 5000"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Roles<span className="text-error-500">*</span></Label>
                <div className="flex flex-wrap gap-3">
                  {ROLE_OPTIONS.map((role) => {
                    const checked = formState.roles.includes(role);
                    return (
                      <label key={role} className="inline-flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRoleSelection(role)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        <span>{role}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="contact-address-billing">Billing Address</Label>
                <textarea
                  id="contact-address-billing"
                  rows={2}
                  value={formState.address_billing}
                  onChange={(e) => handleFormChange('address_billing', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="contact-address-shipping">Shipping Address</Label>
                <textarea
                  id="contact-address-shipping"
                  rows={2}
                  value={formState.address_shipping}
                  onChange={(e) => handleFormChange('address_shipping', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="contact-tax">Tax Number</Label>
                <input
                  id="contact-tax"
                  value={formState.tax_number}
                  onChange={(e) => handleFormChange('tax_number', e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="contact-distribution">Distribution Channel</Label>
                <input
                  id="contact-distribution"
                  value={formState.distribution_channel}
                  onChange={(e) => handleFormChange('distribution_channel', e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="contact-pic-name">PIC Name</Label>
                <input
                  id="contact-pic-name"
                  value={formState.pic_name}
                  onChange={(e) => handleFormChange('pic_name', e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="contact-bank">Bank Account Number</Label>
                <input
                  id="contact-bank"
                  value={formState.bank_account_number}
                  onChange={(e) => handleFormChange('bank_account_number', e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="contact-payment-terms">Payment Terms</Label>
                <input
                  id="contact-payment-terms"
                  value={formState.payment_terms}
                  onChange={(e) => handleFormChange('payment_terms', e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="contact-sales">Sales Contact</Label>
                <input
                  id="contact-sales"
                  value={formState.sales_contact_name}
                  onChange={(e) => handleFormChange('sales_contact_name', e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="contact-employee-id">Employee ID</Label>
                <input
                  id="contact-employee-id"
                  value={formState.employee_id}
                  onChange={(e) => handleFormChange('employee_id', e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="contact-department">Department</Label>
                <input
                  id="contact-department"
                  value={formState.department}
                  onChange={(e) => handleFormChange('department', e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="contact-job">Job Title</Label>
                <input
                  id="contact-job"
                  value={formState.job_title}
                  onChange={(e) => handleFormChange('job_title', e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="contact-employment-status">Employment Status</Label>
                <input
                  id="contact-employment-status"
                  value={formState.employment_status}
                  onChange={(e) => handleFormChange('employment_status', e.target.value)}
                  placeholder="e.g. Permanent, Contract"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => router.push('/master-data/contacts')}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : mode === 'create' ? 'Create Contact' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactForm;
