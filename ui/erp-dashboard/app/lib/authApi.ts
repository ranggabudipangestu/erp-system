import { SignupRequest, SignupResponse, LoginRequest, LoginResponse } from '../types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class AuthApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

class AuthApi {
  private async fetchWithError(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // If JSON parsing fails, use statusText
      }
      
      throw new AuthApiError(
        errorMessage,
        response.status,
        response.statusText
      );
    }

    return response;
  }

  async signup(data: SignupRequest): Promise<SignupResponse> {
    const response = await this.fetchWithError('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.fetchWithError('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const response = await this.fetchWithError('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    return response.json();
  }

  async logout(refreshToken: string): Promise<void> {
    await this.fetchWithError('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async forgotPassword(email: string): Promise<void> {
    await this.fetchWithError('/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.fetchWithError('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }
}

export const authApi = new AuthApi();
export { AuthApiError };