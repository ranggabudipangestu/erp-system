import { useState, useEffect } from 'react';
import menuConfig from '@/data/menuConfig.json';

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

export const useMenuData = () => {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMenuData = async () => {
      try {
        setLoading(true);
        // Simulate API call delay - remove this in production
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // In the future, this could be an API call:
        // const response = await fetch('/api/menu-config');
        // const data = await response.json();
        
        setMenuData(menuConfig as MenuData);
        setError(null);
      } catch (err) {
        setError('Failed to load menu configuration');
        console.error('Error loading menu data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMenuData();
  }, []);

  const refreshMenuData = () => {
    setLoading(true);
    setError(null);
    // Re-trigger the effect
    setMenuData(null);
  };

  return {
    menuData,
    loading,
    error,
    refreshMenuData
  };
};