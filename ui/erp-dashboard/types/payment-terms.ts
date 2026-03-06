export interface PaymentTermDto {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string | null;
  due_days: number;
  early_payment_discount_percent?: number | null;
  early_payment_discount_days?: number | null;
  archived_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  created_by: string;
  updated_by?: string | null;
}

export interface PaymentTermListMetadata {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaymentTermListResponse {
  items: PaymentTermDto[];
  metadata: PaymentTermListMetadata;
}

export interface PaymentTermPayload {
  code: string;
  name: string;
  description?: string | null;
  due_days: number;
  early_payment_discount_percent?: number | null;
  early_payment_discount_days?: number | null;
}

export interface PaymentTermCreateRequest extends PaymentTermPayload {
  created_by: string;
}

export interface PaymentTermUpdateRequest extends PaymentTermPayload {
  updated_by: string;
}

export interface PaymentTermListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  include_archived?: boolean;
}