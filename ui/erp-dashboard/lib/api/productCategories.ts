import { AuthService } from "@/lib/auth";
import type { ApiResponse } from "@/types/auth";
import type {
  ProductCategory,
  ProductCategoryTree,
  ProductCategoryCreateRequest,
  ProductCategoryUpdateRequest,
} from "@/types/productCategories";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const buildQueryString = (
  params: Record<string, string | number | boolean | undefined | null>,
) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.append(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export class ProductCategoriesApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public traceId?: string,
    public errors: any[] = [],
    public metadata: Record<string, any> = {},
  ) {
    super(message);
    this.name = "ProductCategoriesApiError";
  }
}

class ProductCategoriesApi {
  private getAuthHeaders(): Record<string, string> {
    const tokens = AuthService.getTokens();
    if (tokens?.access_token) {
      return { Authorization: `Bearer ${tokens.access_token}` };
    }
    return {};
  }

  private async fetchWithEnvelope<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const headers = {
      "Content-Type": "application/json",
      ...this.getAuthHeaders(),
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const isEnvelope = data && typeof data === "object" && "traceId" in data;

    if (!response.ok) {
      const isUnauthorized = response.status === 401;

      if (isEnvelope && data.error) {
        const error = data.error;
        if (isUnauthorized || error.code === "UNAUTHORIZED") {
          AuthService.handleUnauthorized();
        }
        throw new ProductCategoriesApiError(
          error.message || response.statusText || "Request failed",
          response.status,
          error.code || response.status.toString(),
          data.traceId,
          error.errors || [],
          data.metadata || {},
        );
      }

      if (isUnauthorized) {
        AuthService.handleUnauthorized();
      }

      throw new ProductCategoriesApiError(
        data?.message || response.statusText || "Request failed",
        response.status,
        data?.code || response.status.toString(),
        data?.traceId,
        data?.errors || [],
        data?.metadata || {},
      );
    }

    if (isEnvelope) {
      const envelope = data as ApiResponse<T>;
      if (envelope.error) {
        const error = envelope.error;
        if (error.code === "UNAUTHORIZED") {
          AuthService.handleUnauthorized();
        }
        throw new ProductCategoriesApiError(
          error.message || "Request failed",
          response.status,
          error.code || response.status.toString(),
          envelope.traceId,
          error.errors || [],
          envelope.metadata || {},
        );
      }
      return envelope;
    }

    return {
      traceId: "",
      error: null,
      metadata: null,
      result: data as T,
    };
  }

  async getCategories(params?: {
    search?: string;
    parent_id?: string;
    include_archived?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<ProductCategory[]>> {
    const queryString = params ? buildQueryString(params) : "";
    return this.fetchWithEnvelope<ProductCategory[]>(
      `/master-data/product-categories${queryString}`,
    );
  }

  async getTree(): Promise<ApiResponse<ProductCategoryTree[]>> {
    return this.fetchWithEnvelope<ProductCategoryTree[]>(
      `/master-data/product-categories/tree`,
    );
  }

  async getCategory(id: string): Promise<ApiResponse<ProductCategory>> {
    return this.fetchWithEnvelope<ProductCategory>(
      `/master-data/product-categories/${id}`,
    );
  }

  async createCategory(
    data: ProductCategoryCreateRequest,
  ): Promise<ApiResponse<ProductCategory>> {
    return this.fetchWithEnvelope<ProductCategory>(
      "/master-data/product-categories",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  async updateCategory(
    id: string,
    data: ProductCategoryUpdateRequest,
  ): Promise<ApiResponse<ProductCategory>> {
    return this.fetchWithEnvelope<ProductCategory>(
      `/master-data/product-categories/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  }

  async deleteCategory(id: string): Promise<ApiResponse<{ id: string }>> {
    return this.fetchWithEnvelope<{ id: string }>(
      `/master-data/product-categories/${id}`,
      {
        method: "DELETE",
      },
    );
  }
}

export const productCategoriesApi = new ProductCategoriesApi();
