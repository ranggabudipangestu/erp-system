export interface Unit {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  value: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string | null;
}

export interface UnitCreateRequest {
  code: string;
  name: string;
  value: number;
}

export interface UnitUpdateRequest {
  code: string;
  name: string;
  value: number;
}

export interface UnitListResponse {
  items: Unit[];
  total: number;
  page: number;
  size: number;
}
