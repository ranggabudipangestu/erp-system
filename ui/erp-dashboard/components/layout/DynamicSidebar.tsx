'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { groupMenusByModule } from '@/types/permissions';
import * as LucideIcons from 'lucide-react';

interface DynamicSidebarProps {
  className?: string;
}

const DynamicSidebar: React.FC<DynamicSidebarProps> = ({ className = '' }) => {
  const pathname = usePathname();
  const { availableMenus, getAvailableMenuItems, isLoading } = usePermissions();

  // Helper function to get Lucide icon component
  const getIcon = (iconName?: string) => {
    if (!iconName) return LucideIcons.Circle;
    
    // Convert icon name to PascalCase for Lucide icons
    const iconComponentName = iconName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    
    return (LucideIcons as any)[iconComponentName] || LucideIcons.Circle;
  };

  // Check if current path is active
  const isActivePath = (route?: string) => {
    if (!route) return false;
    return pathname === route || pathname.startsWith(route + '/');
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800 text-white w-64 min-h-screen p-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!availableMenus) {
    return (
      <div className={`bg-gray-800 text-white w-64 min-h-screen p-4 ${className}`}>
        <div className="text-center py-8 text-gray-400">
          <p>No menu data available</p>
        </div>
      </div>
    );
  }

  const availableMenuItems = getAvailableMenuItems();
  const menusByModule = groupMenusByModule(availableMenuItems, availableMenus.modules);

  return (
    <div className={`bg-gray-800 text-white w-64 min-h-screen flex flex-col ${className}`}>
      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-700">
        <Link href="/dashboard" className="block">
          <h1 className="text-xl font-bold text-white">ERP System</h1>
          <p className="text-sm text-gray-300">
            Plan: {availableMenus.plan_name}
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Dashboard Link - Always available */}
        <Link
          href="/dashboard"
          className={`
            flex items-center px-3 py-2 text-sm rounded-md transition-colors
            ${isActivePath('/dashboard') 
              ? 'bg-gray-900 text-white' 
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }
          `}
        >
          <LucideIcons.LayoutDashboard className="h-4 w-4 mr-3" />
          Dashboard
        </Link>

        {/* Dynamic Menu Items grouped by Module */}
        {Object.values(menusByModule)
          .sort((a, b) => a.module.sort_order - b.module.sort_order)
          .map(({ module, items }) => {
            const ModuleIcon = getIcon(module.icon);
            
            return (
              <div key={module.id} className="space-y-2">
                {/* Module Header */}
                <div className="flex items-center px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <ModuleIcon className="h-4 w-4 mr-2" />
                  {module.name}
                </div>
                
                {/* Module Menu Items */}
                <div className="ml-6 space-y-1">
                  {items
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((item) => {
                      const ItemIcon = getIcon(item.icon);
                      const isActive = isActivePath(item.route);
                      
                      return (
                        <Link
                          key={item.id}
                          href={item.route || '#'}
                          className={`
                            flex items-center px-3 py-2 text-sm rounded-md transition-colors
                            ${isActive 
                              ? 'bg-gray-900 text-white' 
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }
                          `}
                        >
                          <ItemIcon className="h-4 w-4 mr-3" />
                          {item.name}
                        </Link>
                      );
                    })
                  }
                </div>
              </div>
            );
          })
        }
        
        {availableMenuItems.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <LucideIcons.Lock className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No menu items available</p>
            <p className="text-xs mt-1">Contact your administrator</p>
          </div>
        )}
      </nav>

      {/* Footer - Current Plan Info */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Available Menus:</span>
            <span className="text-gray-300">{availableMenuItems.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Current Plan:</span>
            <span className="text-blue-400 font-medium">{availableMenus.current_plan}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicSidebar;