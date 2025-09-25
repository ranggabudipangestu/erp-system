import { useState, useEffect, useCallback } from 'react';
import { permissionService } from '@/lib/api/permissions';
import { AuthService } from '@/lib/auth';
import { NavigationModule } from '@/types/permissions';

export interface MenuItem {
  id: string;
  name: string;
  icon?: string | null;
  path?: string;
  pro?: boolean;
  new?: boolean;
  children?: MenuItem[];
  category?: 'transactions' | 'reports' | 'other';
}

export interface MenuData {
  mainMenu: MenuItem[];
  otherMenu: MenuItem[];
}

const MODULE_ICON_MAP: Record<string, string> = {
  master_data: 'table',
  finance: 'dollar-sign',
  inventory: 'package',
  purchasing: 'shopping-cart',
  sales: 'bar-chart',
  manufacturing: 'factory',
  administration: 'users',
  permissions: 'shield',
  reporting: 'pie-chart',
};

const transformNavigation = (navModules: NavigationModule[]): MenuData => {
  const resolveCategory = (route?: string): 'transactions' | 'reports' => {
    return route && route.includes('/reports/') ? 'reports' : 'transactions';
  };

  const mainMenu: MenuItem[] = navModules.map((module) => ({
    id: module.code,
    name: module.name,
    icon: module.icon || MODULE_ICON_MAP[module.code] || undefined,
    children: module.items
      .filter((item) => Boolean(item.route))
      .map((item) => ({
        id: item.code,
        name: item.name,
        path: item.route!,
        icon: item.icon,
        category: resolveCategory(item.route),
      })),
  })).filter((module) => (module.children?.length ?? 0) > 0);

  return {
    mainMenu,
    otherMenu: [],
  };
};

export const useMenuData = () => {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMenuData = useCallback(async () => {
    try {
      setLoading(true);
      const tokens = AuthService.getTokens();
      if (!tokens) {
        setMenuData({ mainMenu: [], otherMenu: [] });
        setError(null);
        return;
      }
      const response = await permissionService.getNavigation();
      setMenuData(transformNavigation(response.modules));
      setError(null);
    } catch (err) {
      setError('Failed to load menu configuration');
      console.error('Error loading menu data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  const refreshMenuData = () => {
    loadMenuData();
  };

  return {
    menuData,
    loading,
    error,
    refreshMenuData
  };
};
