export type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "EQUITY"
  | "REVENUE"
  | "EXPENSE";
export type NormalBalance = "DEBIT" | "CREDIT";

export interface ChartOfAccountDto {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  code: string;
  name: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  level: number;
  description: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string | null;
}

export interface ChartOfAccountTreeDto {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  code: string;
  name: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  level: number;
  description: string | null;
  is_active: boolean;
  children: ChartOfAccountTreeDto[];
}

export interface ChartOfAccountCreateRequest {
  code: string;
  name: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  parent_id?: string | null;
  description?: string | null;
  is_active: boolean;
  created_by: string;
}

export interface ChartOfAccountUpdateRequest {
  code: string;
  name: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  parent_id?: string | null;
  description?: string | null;
  is_active: boolean;
  updated_by: string;
}

export interface ChartOfAccountListParams {
  search?: string;
  account_type?: AccountType;
  include_archived?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ChartOfAccountListResponse {
  items: ChartOfAccountDto[];
  metadata: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ASSET: "Aset",
  LIABILITY: "Liabilitas",
  EQUITY: "Ekuitas",
  REVENUE: "Pendapatan",
  EXPENSE: "Beban",
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  ASSET: "bg-blue-100 text-blue-700",
  LIABILITY: "bg-red-100 text-red-700",
  EQUITY: "bg-purple-100 text-purple-700",
  REVENUE: "bg-green-100 text-green-700",
  EXPENSE: "bg-orange-100 text-orange-700",
};

export const NORMAL_BALANCE_DEFAULT: Record<AccountType, NormalBalance> = {
  ASSET: "DEBIT",
  EXPENSE: "DEBIT",
  LIABILITY: "CREDIT",
  EQUITY: "CREDIT",
  REVENUE: "CREDIT",
};
