export type ContactRole = 'Customer' | 'Supplier' | 'Employee';
export type ContactStatus = 'Active' | 'Archived';

export interface ContactDto {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address_billing?: string | null;
  address_shipping?: string | null;
  tax_number?: string | null;
  roles: ContactRole[];
  status: ContactStatus;
  credit_limit?: number | null;
  distribution_channel?: string | null;
  pic_name?: string | null;
  bank_account_number?: string | null;
  payment_terms?: string | null;
  sales_contact_name?: string | null;
  employee_id?: string | null;
  department?: string | null;
  job_title?: string | null;
  employment_status?: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  created_by: string;
  updated_by?: string | null;
}

export interface ContactListMetadata {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ContactListResponse {
  items: ContactDto[];
  metadata: ContactListMetadata;
}

export interface ContactPayload {
  code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address_billing?: string | null;
  address_shipping?: string | null;
  tax_number?: string | null;
  roles: ContactRole[];
  credit_limit?: number | null;
  distribution_channel?: string | null;
  pic_name?: string | null;
  bank_account_number?: string | null;
  payment_terms?: string | null;
  sales_contact_name?: string | null;
  employee_id?: string | null;
  department?: string | null;
  job_title?: string | null;
  employment_status?: string | null;
}

export interface ContactCreateRequest extends ContactPayload {
  created_by: string;
}

export interface ContactUpdateRequest extends ContactPayload {
  updated_by: string;
}

export interface ContactListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  roles?: ContactRole[];
  status?: ContactStatus | '';
}

export interface ContactImportSummary {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}
