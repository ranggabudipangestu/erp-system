'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { groupMenusByModule } from '@/types/permissions';
import * as Icons from 'lucide-react';

// Icon mapping for different modules
const getModuleIcon = (iconName?: string) => {
  if (!iconName) return Icons.Circle;
  
  const iconMap: Record<string, any> = {
    database: Icons.Database,
    'trending-up': Icons.TrendingUp,
    'shopping-cart': Icons.ShoppingCart,
    package: Icons.Package,
    'dollar-sign': Icons.DollarSign,
    settings: Icons.Settings,
    'bar-chart': Icons.BarChart,
    box: Icons.Box,
    users: Icons.Users,
    tag: Icons.Tag,
    'file-text': Icons.FileText,
    'shopping-bag': Icons.ShoppingBag,
    'user-check': Icons.UserCheck,
    'clipboard-list': Icons.ClipboardList,
    receipt: Icons.Receipt,
    truck: Icons.Truck,
    layers: Icons.Layers,
    home: Icons.Home,
    activity: Icons.Activity,
    list: Icons.List,
    'book-open': Icons.BookOpen,
    'pie-chart': Icons.PieChart,
    'git-branch': Icons.GitBranch,
    tool: Icons.Tool,
    cpu: Icons.Cpu,
  };
  
  return iconMap[iconName] || Icons.Circle;
};

interface PermissionBasedSidebarProps {
  isCollapsed?: boolean;
  className?: string;
}

const PermissionBasedSidebar: React.FC<PermissionBasedSidebarProps> = ({
  isCollapsed = false,
  className = ''
}) => {
  const pathname = usePathname();
  const { availableMenus, getAvailableMenuItems, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className={`bg-gray-800 text-white flex flex-col ${className}`}>
        <div className="p-4 space-y-4 animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const availableMenuItems = getAvailableMenuItems();
  
  if (!availableMenus || availableMenuItems.length === 0) {
    return (
      <div className={`bg-gray-800 text-white flex flex-col ${className}`}>
        {/* Logo/Brand */}
        <div className="p-4 border-b border-gray-700">
          {!isCollapsed && (
            <>
              <h1 className="text-xl font-bold">ERP System</h1>
              <p className="text-sm text-gray-300">No access</p>
            </>
          )}
        </div>

        <div className="flex-1 p-4 text-center">
          <div className="text-gray-400">
            <Icons.AlertCircle className="h-12 w-12 mx-auto mb-2" />
            {!isCollapsed && (
              <>
                <p className="text-sm">No menu items available</p>
                <p className="text-xs mt-1">Contact administrator</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Group menu items by module
  const menuByModule = groupMenusByModule(availableMenuItems, availableMenus.modules);
  
  const isActive = (route?: string) => {
    if (!route) return false;
    return pathname === route || pathname.startsWith(route + '/');
  };

  return (
    <div className={`bg-gray-800 text-white flex flex-col ${className}`}>
      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-700">
        {!isCollapsed && (
          <>
            <h1 className="text-xl font-bold">ERP System</h1>
            <p className="text-sm text-gray-300">
              Plan: {availableMenus.plan_name}
            </p>
          </>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {Object.values(menuByModule)
          .sort((a, b) => a.module.sort_order - b.module.sort_order)
          .map(({ module, items }) => {
            const ModuleIcon = getModuleIcon(module.icon);
            
            return (
              <div key={module.id} className="space-y-2">
                {/* Module Header */}
                {!isCollapsed && (
                  <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-300">
                    <ModuleIcon className="h-4 w-4 mr-2" />
                    {module.name}
                  </div>
                )}
                
                {/* Module Menu Items */}
                <div className={isCollapsed ? 'space-y-1' : 'ml-6 space-y-1'}>
                  {items
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((item) => {
                      const ItemIcon = getModuleIcon(item.icon);
                      const active = isActive(item.route);
                      
                      return (
                        <Link
                          key={item.id}
                          href={item.route || '#'}
                          className={`
                            flex items-center px-3 py-2 text-sm rounded-md transition-colors
                            ${active 
                              ? 'bg-gray-900 text-white' 
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }
                            ${isCollapsed ? 'justify-center' : ''}
                          `}
                          title={isCollapsed ? item.name : ''}
                        >
                          <ItemIcon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                          {!isCollapsed && item.name}
                        </Link>
                      );
                    })
                  }
                </div>
              </div>
            );
          })
        }
        
        {/* Administration Section - Always show if user has role management access */}
        <div className="space-y-2 pt-4 border-t border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-300">
              <Icons.Shield className="h-4 w-4 mr-2" />
              Administration
            </div>
          )}
          
          <div className={isCollapsed ? 'space-y-1' : 'ml-6 space-y-1'}>
            <Link
              href="/user-management/roles"
              className={`
                flex items-center px-3 py-2 text-sm rounded-md transition-colors
                ${isActive('/user-management/roles')
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'Role Management' : ''}
            >
              <Icons.Settings className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && 'Role Management'}
            </Link>
            
            <Link
              href="/user-management/users"
              className={`
                flex items-center px-3 py-2 text-sm rounded-md transition-colors
                ${isActive('/user-management/users')
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'User Management' : ''}
            >
              <Icons.Users className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && 'User Management'}
            </Link>
          </div>
        </div>
      </nav>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User</p>
              <p className="text-xs text-gray-400 truncate">user@example.com</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionBasedSidebar;