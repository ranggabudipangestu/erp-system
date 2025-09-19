import { useState, useEffect, useCallback } from 'react';
import { permissionService } from '@/lib/api/permissions';
import { AuthService } from '@/lib/auth';
import { NavigationModule } from '@/types/permissions';

export interface MenuItem {
  id: string;
  name: string;
  icon?: string;
  path?: string;
  pro?: boolean;
  new?: boolean;
  children?: MenuItem[];
}

export interface MenuData {
  mainMenu: MenuItem[];
  otherMenu: MenuItem[];
}

const ICON_MAP: Record<string, string> = {
  database: 'TableIcon',
  wallet: 'PieChartIcon',
  boxes: 'BoxCubeIcon',
  'shopping-cart': 'DocsIcon',
  'trending-up': 'GridIcon',
  factory: 'BoxCubeIcon',
  shield: 'UserCircleIcon',
  package: 'BoxCubeIcon',
  'bar-chart': 'PieChartIcon',
  'dollar-sign': 'PieChartIcon',
};

const resolveIcon = (icon?: string): string | undefined => {
  if (!icon) return undefined;
  const normalized = icon.toLowerCase();
  return ICON_MAP[normalized] || 'GridIcon';
};

const transformNavigation = (navModules: NavigationModule[]): MenuData => {
  const mainMenu: MenuItem[] = navModules.map((module) => ({
    id: module.code,
    name: module.name,
    icon: resolveIcon(module.icon),
    children: module.items
      .filter((item) => Boolean(item.route))
      .map((item) => ({
        id: item.code,
        name: item.name,
        path: item.route!,
      })),
  })).filter((module) => module.children && module.children.length > 0);

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
