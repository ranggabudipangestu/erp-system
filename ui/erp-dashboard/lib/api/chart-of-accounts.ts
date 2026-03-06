import { AuthService } from "@/lib/auth";
import type {
  ChartOfAccountCreateRequest,
  ChartOfAccountDto,
  ChartOfAccountListParams,
  ChartOfAccountListResponse,
  ChartOfAccountTreeDto,
  ChartOfAccountUpdateRequest,
} from "@/types/chart-of-accounts";
import type { ApiResponse } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const buildQueryString = (
  params: Record<string, string | boolean | undefined | null>,
) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.append(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export class CoAApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public traceId?: string,
  ) {
    super(message);
    this.name = "CoAApiError";
  }
}

class ChartOfAccountsApi {
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
      if (response.status === 401) AuthService.handleUnauthorized();
      if (isEnvelope && data.error) {
        throw new CoAApiError(
          data.error.message || response.statusText,
          response.status,
          data.error.code || String(response.status),
          data.traceId,
        );
      }
      throw new CoAApiError(
        data?.detail || response.statusText || "Request failed",
        response.status,
        String(response.status),
      );
    }

    if (isEnvelope) {
      const envelope = data as ApiResponse<T>;
      if (envelope.error) {
        if (envelope.error.code === "UNAUTHORIZED")
          AuthService.handleUnauthorized();
        throw new CoAApiError(
          envelope.error.message || "Request failed",
          response.status,
          envelope.error.code || String(response.status),
          envelope.traceId,
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

  async listAccounts(
    params: ChartOfAccountListParams = {},
  ): Promise<ChartOfAccountListResponse> {
    const query = buildQueryString({
      page: params.page?.toString(),
      pageSize: params.pageSize?.toString(),
      search: params.search,
      account_type: params.account_type,
      include_archived: params.include_archived,
    });
    const response = await this.fetchWithEnvelope<ChartOfAccountDto[]>(
      `/master-data/chart-of-accounts${query}`,
    );
    const metadata = response.metadata || {};
    return {
      items: response.result,
      metadata: {
        total: metadata.total ?? response.result.length,
        page: metadata.page ?? params.page ?? 1,
        pageSize:
          metadata.pageSize ?? params.pageSize ?? response.result.length,
        totalPages: metadata.totalPages ?? 1,
      },
    };
  }

  async getTree(): Promise<ChartOfAccountTreeDto[]> {
    const response = await this.fetchWithEnvelope<ChartOfAccountTreeDto[]>(
      "/master-data/chart-of-accounts/tree",
    );
    return response.result;
  }

  async getAccount(id: string): Promise<ChartOfAccountDto> {
    const response = await this.fetchWithEnvelope<ChartOfAccountDto>(
      `/master-data/chart-of-accounts/${id}`,
    );
    return response.result;
  }

  async createAccount(
    payload: ChartOfAccountCreateRequest,
  ): Promise<ChartOfAccountDto> {
    const response = await this.fetchWithEnvelope<ChartOfAccountDto>(
      "/master-data/chart-of-accounts",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    return response.result;
  }

  async updateAccount(
    id: string,
    payload: ChartOfAccountUpdateRequest,
  ): Promise<ChartOfAccountDto> {
    const response = await this.fetchWithEnvelope<ChartOfAccountDto>(
      `/master-data/chart-of-accounts/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
    return response.result;
  }

  async archiveAccount(id: string): Promise<{ id: string }> {
    const response = await this.fetchWithEnvelope<{ id: string }>(
      `/master-data/chart-of-accounts/${id}`,
      {
        method: "DELETE",
      },
    );
    return response.result;
  }
}

export const coaApi = new ChartOfAccountsApi();
