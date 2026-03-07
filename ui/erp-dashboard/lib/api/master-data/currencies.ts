import { AuthService } from "@/lib/auth";
import type { ApiResponse } from "@/types/auth";
import type { PaginatedResponse } from "@/types/api";
import type {
  Currency,
  CurrencyCreatePayload,
  CurrencyUpdatePayload,
} from "@/types/currencies";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const buildQueryString = (
  params: Record<string, string | number | boolean | undefined | null>,
) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.append(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export class CurrenciesApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public traceId?: string,
    public errors: any[] = [],
    public metadata: Record<string, any> = {},
  ) {
    super(message);
    this.name = "CurrenciesApiError";
  }
}

class CurrenciesApi {
  private getAuthHeaders(): Record<string, string> {
    const tokens = AuthService.getTokens();
    if (tokens?.access_token) {
      return {
        Authorization: `Bearer ${tokens.access_token}`,
      };
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

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        throw new CurrenciesApiError(
          "Invalid response format from server",
          response.status,
          "INVALID_JSON",
        );
      }

      if (!response.ok) {
        throw new CurrenciesApiError(
          data.error?.message || data.message || "An error occurred",
          response.status,
          data.error?.code || data.code || "UNKNOWN_ERROR",
          data.traceId,
          data.error?.details,
        );
      }

      return data as ApiResponse<T>;
    } catch (error) {
      if (error instanceof CurrenciesApiError) {
        throw error;
      }
      throw new CurrenciesApiError(
        error instanceof Error ? error.message : "Network error",
        0,
        "NETWORK_ERROR",
      );
    }
  }

  async list(params?: {
    search?: string;
    page?: number;
    page_size?: number;
    include_archived?: boolean;
  }): Promise<ApiResponse<PaginatedResponse<Currency[]>>> {
    const queryString = params ? buildQueryString(params) : "";
    return this.fetchWithEnvelope<PaginatedResponse<Currency[]>>(
      `/master-data/currencies${queryString}`,
    );
  }

  async get(id: string): Promise<ApiResponse<Currency>> {
    return this.fetchWithEnvelope<Currency>(`/master-data/currencies/${id}`);
  }

  async create(data: CurrencyCreatePayload): Promise<ApiResponse<Currency>> {
    return this.fetchWithEnvelope<Currency>("/master-data/currencies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(
    id: string,
    data: CurrencyUpdatePayload,
  ): Promise<ApiResponse<Currency>> {
    return this.fetchWithEnvelope<Currency>(`/master-data/currencies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async archive(id: string): Promise<ApiResponse<Currency>> {
    return this.fetchWithEnvelope<Currency>(`/master-data/currencies/${id}`, {
      method: "DELETE",
    });
  }
}

export const currenciesApi = new CurrenciesApi();
