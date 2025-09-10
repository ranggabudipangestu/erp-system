import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon } from '@/icons/index';
import { MenuItem } from '@/hooks/useMenuData';
import { getIconComponent } from '@/utils/iconMapper';

interface MenuRendererProps {
  items: MenuItem[];
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen: boolean;
  openSubmenus: Record<string, boolean>;
  onSubmenuToggle: (itemId: string) => void;
  level?: number;
}

const MenuRenderer: React.FC<MenuRendererProps> = ({
  items,
  isExpanded,
  isHovered,
  isMobileOpen,
  openSubmenus,
  onSubmenuToggle,
  level = 0
}) => {
  const pathname = usePathname();

  const isActive = (path: string) => path === pathname;

  const isItemActive = (item: MenuItem): boolean => {
    if (item.path && isActive(item.path)) return true;
    if (item.children) {
      return item.children.some(child => isItemActive(child));
    }
    return false;
  };

  const shouldShowText = isExpanded || isHovered || isMobileOpen;
  
  // Define indent classes based on level
  const getIndentClass = (level: number) => {
    switch (level) {
      case 0: return '';
      case 1: return 'ml-6';
      case 2: return 'ml-10';
      case 3: return 'ml-14';
      default: return 'ml-16';
    }
  };
  
  return (
    <ul className={`flex flex-col ${level === 0 ? 'gap-4' : 'gap-2'}`}>
      {items.map((item) => (
        <li key={item.id}>
          {item.children ? (
            // Item with children - render as expandable menu
            <div className={getIndentClass(level)}>
              <button
                onClick={() => onSubmenuToggle(item.id)}
                className={`menu-item group w-full ${
                  isItemActive(item)
                    ? 'menu-item-active'
                    : 'menu-item-inactive'
                } cursor-pointer ${
                  !shouldShowText && level === 0
                    ? 'lg:justify-center'
                    : 'lg:justify-start'
                }`}
              >
                {item.icon && level === 0 && (
                  <span
                    className={`${
                      isItemActive(item)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive'
                    }`}
                  >
                    {getIconComponent(item.icon)}
                  </span>
                )}
                
                {shouldShowText && (
                  <>
                    <span className="menu-item-text">{item.name}</span>
                    <ChevronDownIcon
                      className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                        openSubmenus[item.id]
                          ? 'rotate-180 text-brand-500'
                          : ''
                      }`}
                    />
                  </>
                )}
              </button>

              {/* Submenu */}
              {item.children && shouldShowText && (
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openSubmenus[item.id] ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className={`${level === 0 ? 'mt-2' : 'mt-1'}`}>
                    <MenuRenderer
                      items={item.children}
                      isExpanded={isExpanded}
                      isHovered={isHovered}
                      isMobileOpen={isMobileOpen}
                      openSubmenus={openSubmenus}
                      onSubmenuToggle={onSubmenuToggle}
                      level={level + 1}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Item with path - render as link
            item.path && (
              <div className={getIndentClass(level)}>
                <Link
                  href={item.path}
                  className={level > 0 ? `menu-dropdown-item ${
                    isActive(item.path)
                      ? 'menu-dropdown-item-active'
                      : 'menu-dropdown-item-inactive'
                  }` : `menu-item group ${
                    isActive(item.path)
                      ? 'menu-item-active'
                      : 'menu-item-inactive'
                  }`}
                >
                {item.icon && level === 0 && (
                  <span
                    className={`${
                      isActive(item.path)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive'
                    }`}
                  >
                    {getIconComponent(item.icon)}
                  </span>
                )}
                
                {shouldShowText && (
                  <>
                    <span className={level === 0 ? 'menu-item-text' : ''}>
                      {item.name}
                    </span>
                    
                    {/* Badges */}
                    <span className="flex items-center gap-1 ml-auto">
                      {item.new && (
                        <span
                          className={`ml-auto ${
                            isActive(item.path) && level > 0
                              ? 'menu-dropdown-badge-active'
                              : level > 0
                              ? 'menu-dropdown-badge-inactive'
                              : 'bg-green-100 text-green-600 bg-opacity-10'
                          } menu-dropdown-badge`}
                        >
                          new
                        </span>
                      )}
                      {item.pro && (
                        <span
                          className={`ml-auto ${
                            isActive(item.path) && level > 0
                              ? 'menu-dropdown-badge-active'
                              : level > 0
                              ? 'menu-dropdown-badge-inactive'
                              : 'bg-orange-100 text-orange-600 bg-opacity-10'
                          } menu-dropdown-badge`}
                        >
                          pro
                        </span>
                      )}
                    </span>
                  </>
                )}
              </Link>
              </div>
            )
          )}
        </li>
      ))}
    </ul>
  );
};

export default MenuRenderer;