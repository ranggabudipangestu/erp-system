import { AuthService } from '@/lib/auth';
import type {
  ContactCreateRequest,
  ContactDto,
  ContactImportSummary,
  ContactListParams,
  ContactListResponse,
  ContactUpdateRequest,
} from '@/types/contacts';
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

export class ContactsApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public traceId?: string,
    public errors: any[] = [],
    public metadata: Record<string, any> = {},
  ) {
    super(message);
    this.name = 'ContactsApiError';
  }
}

class ContactsApi {
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
        throw new ContactsApiError(
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
      throw new ContactsApiError(message, response.status, data?.code || response.status.toString(), data?.traceId);
    }

    if (isEnvelope) {
      const envelope = data as ApiResponse<T>;
      if (envelope.success === false) {
        const error = envelope.error ?? {};
        if (error?.code === 'UNAUTHORIZED') {
          AuthService.handleUnauthorized();
        }
        throw new ContactsApiError(
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

  async listContacts(params: ContactListParams = {}): Promise<ContactListResponse> {
    const query = buildQueryString({
      page: params.page?.toString(),
      pageSize: params.pageSize?.toString(),
      search: params.search,
      status: params.status,
      roles: params.roles,
    });

    const response = await this.fetchWithEnvelope<ContactDto[]>(`/master-data/contacts${query}`);
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

  async createContact(payload: ContactCreateRequest): Promise<ContactDto> {
    const response = await this.fetchWithEnvelope<ContactDto>(`/master-data/contacts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.result;
  }

  async getContact(contactId: string): Promise<ContactDto> {
    const response = await this.fetchWithEnvelope<ContactDto>(`/master-data/contacts/${contactId}`);
    return response.result;
  }

  async updateContact(contactId: string, payload: ContactUpdateRequest): Promise<ContactDto> {
    const response = await this.fetchWithEnvelope<ContactDto>(`/master-data/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.result;
  }

  async archiveContact(contactId: string): Promise<{ id: string; status: string }> {
    const response = await this.fetchWithEnvelope<{ id: string; status: string }>(`/master-data/contacts/${contactId}`, {
      method: 'DELETE',
    });
    return response.result;
  }

  async importContacts(file: File): Promise<ContactImportSummary> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/master-data/contacts/import`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data?.success) {
      const errorInfo = data?.error ?? {};
      throw new ContactsApiError(
        errorInfo?.message || 'Failed to import contacts',
        response.status,
        errorInfo?.code || response.status.toString(),
        data?.traceId,
        errorInfo?.errors || [],
        data?.metadata || {},
      );
    }

    return data.result as ContactImportSummary;
  }

  async exportContacts(params: ContactListParams = {}): Promise<Blob> {
    const query = buildQueryString({
      page: params.page?.toString(),
      pageSize: params.pageSize?.toString(),
      search: params.search,
      status: params.status,
      roles: params.roles,
    });

    const response = await fetch(`${API_BASE_URL}/master-data/contacts/export${query}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new ContactsApiError('Failed to export contacts', response.status, response.statusText || 'EXPORT_FAILED');
    }

    return response.blob();
  }
}

export const contactsApi = new ContactsApi();
