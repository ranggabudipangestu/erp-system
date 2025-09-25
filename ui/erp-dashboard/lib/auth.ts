export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  tenant_id: string;
  user_id: string;
  expires_at: number;
  user_info: {
    user: any;
    tenant: any;
  };
}

export const AuthService = {
  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const accessToken = localStorage.getItem('erp_access_token');
    const expiresAt = localStorage.getItem('erp_token_expires');
    
    if (!accessToken || !expiresAt) return false;
    
    // Check if token is expired
    const now = Date.now();
    const tokenExpiry = parseInt(expiresAt);
    
    return now < tokenExpiry;
  },

  // Get auth tokens
  getTokens(): AuthTokens | null {
    if (typeof window === 'undefined') return null;
    
    const accessToken = localStorage.getItem('erp_access_token');
    const refreshToken = localStorage.getItem('erp_refresh_token');
    const tenantId = localStorage.getItem('erp_tenant_id');
    const userId = localStorage.getItem('erp_user_id');
    const expiresAt = localStorage.getItem('erp_token_expires');
    const userInfo = localStorage.getItem('erp_user_info');
    
    if (!accessToken || !refreshToken || !tenantId || !userId || !expiresAt) {
      return null;
    }
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      tenant_id: tenantId,
      user_id: userId,
      expires_at: parseInt(expiresAt),
      user_info: userInfo ? JSON.parse(userInfo) : null
    };
  },

  // Clear auth data (logout)
  clearAuth(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('erp_access_token');
    localStorage.removeItem('erp_refresh_token');
    localStorage.removeItem('erp_tenant_id');
    localStorage.removeItem('erp_user_id');
    localStorage.removeItem('erp_token_expires');
    localStorage.removeItem('erp_user_info');
  },

  handleUnauthorized(): void {
    if (typeof window === 'undefined') return;

    this.clearAuth();

    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },

  // Get user info
  getUserInfo(): any {
    if (typeof window === 'undefined') return null;
    
    const userInfo = localStorage.getItem('erp_user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  decodeAccessToken(): Record<string, any> | null {
    if (typeof window === 'undefined') return null;

    const tokens = this.getTokens();
    const rawToken = tokens?.access_token;

    if (!rawToken) return null;

    const parts = rawToken.split('.');
    if (parts.length !== 3) return null;

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const decoded = window.atob(padded);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to decode access token payload:', error);
      return null;
    }
  },

  getCurrentUser(): { id?: string; email?: string; name?: string; roles?: string[] } | null {
    const tokenPayload = this.decodeAccessToken();
    if (tokenPayload) {
      return {
        id: tokenPayload.sub || tokenPayload.user_id,
        email: tokenPayload.email,
        name: tokenPayload.name || tokenPayload.full_name,
        roles: tokenPayload.roles || tokenPayload.permissions || [],
      };
    }

    const storedInfo = this.getUserInfo();
    if (storedInfo?.user) {
      return {
        id: storedInfo.user.id,
        email: storedInfo.user.email,
        name: storedInfo.user.name,
        roles: storedInfo.user.roles || storedInfo.tenant?.roles,
      };
    }

    return null;
  }
};
