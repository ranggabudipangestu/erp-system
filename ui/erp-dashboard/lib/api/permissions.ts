import { AuthService } from '@/lib/auth';
import {
  AvailableMenusResponse,
  NavigationResponse,
  Role,
  RoleCreateData,
  RoleUpdateData,
  SubscriptionPlan
} from '@/types/permissions';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class PermissionService {
  private getAuthHeaders(): Record<string, string> {
    const tokens = AuthService.getTokens();
    if (!tokens) {
      throw new Error('No authentication tokens found');
    }
    
    return {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get available menus based on current tenant's subscription plan
   */
  async getAvailableMenus(): Promise<AvailableMenusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/permissions/available-menus`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<AvailableMenusResponse>(response);
  }

  async getNavigation(): Promise<NavigationResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/permissions/navigation`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<NavigationResponse>(response);
  }

  /**
   * Get all roles for current tenant
   */
  async getRoles(): Promise<Role[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/permissions/roles`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<Role[]>(response);
  }

  /**
   * Get specific role with permissions
   */
  async getRole(roleId: string): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/api/v1/permissions/roles/${roleId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<Role>(response);
  }

  /**
   * Create a new role
   */
  async createRole(roleData: RoleCreateData): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/api/v1/permissions/roles`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(roleData),
    });
    
    return this.handleResponse<Role>(response);
  }

  /**
   * Update role and permissions
   */
  async updateRole(roleId: string, roleData: RoleUpdateData): Promise<Role> {
    const response = await fetch(`${API_BASE_URL}/api/v1/permissions/roles/${roleId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(roleData),
    });
    
    return this.handleResponse<Role>(response);
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/permissions/roles/${roleId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<{ message: string }>(response);
  }

  /**
   * Get all subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/permissions/subscription-plans`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<SubscriptionPlan[]>(response);
  }

  /**
   * Get current user's effective permissions
   */
  async getUserPermissions(): Promise<Record<string, Record<string, boolean>>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/permissions/user-permissions`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const payload = await this.handleResponse<{ permissions: Record<string, Record<string, boolean>> }>(response);
    return payload.permissions ?? {};
  }
}

// Export singleton instance
export const permissionService = new PermissionService();
