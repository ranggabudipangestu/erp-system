export interface Currency {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number | string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string | null;
}

export interface CurrencyCreatePayload {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number | string;
}

export interface CurrencyUpdatePayload {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number | string;
}
