export interface ProductCategory {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string | null;
}

export interface ProductCategoryTree extends ProductCategory {
  children: ProductCategoryTree[];
}

export interface ProductCategoryCreateRequest {
  code: string;
  name: string;
  description?: string;
  parent_id?: string | null;
}

export interface ProductCategoryUpdateRequest {
  code: string;
  name: string;
  description?: string;
  parent_id?: string | null;
}
