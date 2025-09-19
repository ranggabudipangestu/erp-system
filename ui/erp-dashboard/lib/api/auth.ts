import { AuthService } from '@/lib/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiErrorResponse {
  detail?: string;
}

export async function logout(): Promise<void> {
  const tokens = AuthService.getTokens();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (tokens?.access_token) {
    headers['Authorization'] = `Bearer ${tokens.access_token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      let message = `Logout failed with status ${response.status}`;
      try {
        const body = (await response.json()) as ApiErrorResponse;
        if (body?.detail) {
          message = body.detail;
        }
      } catch (error) {
        // ignore JSON parse errors
      }
      throw new Error(message);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Logout request failed');
  }
}
