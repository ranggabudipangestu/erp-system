import { AuthService } from '@/lib/auth';
import type {
  PaymentTermCreateRequest,
  PaymentTermDto,
  PaymentTermListParams,
  PaymentTermListResponse,
  PaymentTermUpdateRequest,
} from '@/types/payment-terms';
import type { ApiResponse } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const buildQueryString = (params: Record<string, string | string[] | undefined | null>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item));
    } else {
      searchParams.append(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export class PaymentTermsApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public traceId?: string,
    public errors: any[] = [],
    public metadata: Record<string, any> = {},
  ) {
    super(message);
    this.name = 'PaymentTermsApiError';
  }
}

class PaymentTermsApi {
  private getAuthHeaders(): Record<string, string> {
    const tokens = AuthService.getTokens();
    if (tokens?.access_token) {
      return {
        Authorization: `Bearer ${tokens.access_token}`,
      };
    }
    return {};
  }

  private async fetchWithEnvelope<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers = {
      'Content-Type': 'application/json',
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

    const isEnvelope = data && typeof data === 'object' && 'success' in data && 'result' in data;

    if (!response.ok) {
      const isUnauthorized = response.status === 401;
      if (isEnvelope && data.success === false) {
        const error = data.error ?? {};
        if (isUnauthorized || error?.code === 'UNAUTHORIZED') {
          AuthService.handleUnauthorized();
        }
        throw new PaymentTermsApiError(
          error?.message || response.statusText || 'Request failed',
          response.status,
          error?.code || response.status.toString(),
          data.traceId,
          error?.errors || [],
          data.metadata || {},
        );
      }

      if (isUnauthorized) {
        AuthService.handleUnauthorized();
      }

      const message = data?.detail || data?.message || response.statusText || 'Request failed';
      throw new PaymentTermsApiError(message, response.status, data?.code || response.status.toString(), data?.traceId);
    }

    if (isEnvelope) {
      const envelope = data as ApiResponse<T>;
      if (envelope.success === false) {
        const error = envelope.error ?? {};
        if (error?.code === 'UNAUTHORIZED') {
          AuthService.handleUnauthorized();
        }
        throw new PaymentTermsApiError(
          error?.message || 'Request failed',
          response.status,
          error?.code || response.status.toString(),
          envelope.traceId,
          error?.errors || [],
          envelope.metadata || {},
        );
      }
      return envelope;
    }

    return {
      success: true,
      traceId: '',
      error: {},
      metadata: {},
      result: data as T,
    };
  }

  async listPaymentTerms(params: PaymentTermListParams = {}): Promise<PaymentTermListResponse> {
    const query = buildQueryString({
      page: params.page?.toString(),
      pageSize: params.pageSize?.toString(),
      search: params.search,
      include_archived: params.include_archived?.toString(),
    });

    const response = await this.fetchWithEnvelope<PaymentTermDto[]>(`/master-data/payment-terms${query}`);
    const metadata = response.metadata || {};

    return {
      items: response.result,
      metadata: {
        total: metadata.total ?? response.result.length,
        page: metadata.page ?? params.page ?? 1,
        pageSize: metadata.pageSize ?? params.pageSize ?? response.result.length,
        totalPages: metadata.totalPages ?? 1,
      },
    };
  }

  async createPaymentTerm(payload: PaymentTermCreateRequest): Promise<PaymentTermDto> {
    const response = await this.fetchWithEnvelope<PaymentTermDto>(`/master-data/payment-terms`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.result;
  }

  async getPaymentTerm(paymentTermId: string): Promise<PaymentTermDto> {
    const response = await this.fetchWithEnvelope<PaymentTermDto>(`/master-data/payment-terms/${paymentTermId}`);
    return response.result;
  }

  async updatePaymentTerm(paymentTermId: string, payload: PaymentTermUpdateRequest): Promise<PaymentTermDto> {
    const response = await this.fetchWithEnvelope<PaymentTermDto>(`/master-data/payment-terms/${paymentTermId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.result;
  }

  async archivePaymentTerm(paymentTermId: string): Promise<{ id: string; status: string }> {
    const response = await this.fetchWithEnvelope<{ id: string; status: string }>(`/master-data/payment-terms/${paymentTermId}`, {
      method: 'DELETE',
    });
    return response.result;
  }

  async exportPaymentTerms(params: PaymentTermListParams = {}): Promise<Blob> {
    const query = buildQueryString({
      page: params.page?.toString(),
      pageSize: params.pageSize?.toString(),
      search: params.search,
      include_archived: params.include_archived?.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/master-data/payment-terms/export${query}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new PaymentTermsApiError('Failed to export payment terms', response.status, response.statusText || 'EXPORT_FAILED');
    }

    return response.blob();
  }
}

export const paymentTermsApi = new PaymentTermsApi();