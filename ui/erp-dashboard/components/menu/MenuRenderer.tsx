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

  const renderIcon = (
    icon: string | null | undefined,
    active: boolean,
    depth: number,
  ) => (
    <span
      className={`flex shrink-0 items-center justify-center ${
        depth === 0 ? 'h-6 w-6' : 'h-5 w-5'
      } ${active ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}`}
      aria-hidden="true"
    >
      {getIconComponent(icon)}
    </span>
  );

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
      {items.map((item) => {
        const indentClass = getIndentClass(level);
        const hasChildren = Array.isArray(item.children) && item.children.length > 0;

        if (hasChildren) {
          const itemActive = isItemActive(item);
          return (
            <li key={item.id}>
              <div className={indentClass}>
                <button
                  onClick={() => onSubmenuToggle(item.id)}
                  className={`menu-item group w-full ${
                    itemActive
                      ? 'menu-item-active'
                      : 'menu-item-inactive'
                  } cursor-pointer ${
                    !shouldShowText && level === 0
                      ? 'lg:justify-center'
                      : 'lg:justify-start'
                  }`}
                >
                  {renderIcon(item.icon, itemActive, level)}

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

                {shouldShowText && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openSubmenus[item.id] ? 'max-h-[1200px]' : 'max-h-0'
                    } ${openSubmenus[item.id] ? 'overflow-y-auto pr-1' : ''}`}
                  >
                    <div className={`${level === 0 ? 'mt-2' : 'mt-1'}`}>
                      <MenuRenderer
                        items={item.children ?? []}
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
            </li>
          );
        }

        if (item.path) {
          const leafActive = isActive(item.path);
          return (
            <li key={item.id}>
              <div className={indentClass}>
                <Link
                  href={item.path}
                  className={level > 0 ? `group menu-dropdown-item ${
                    leafActive
                      ? 'menu-dropdown-item-active'
                      : 'menu-dropdown-item-inactive'
                  }` : `menu-item group ${
                    leafActive
                      ? 'menu-item-active'
                      : 'menu-item-inactive'
                  }`}
                >
                  {renderIcon(item.icon, leafActive, level)}

                  {shouldShowText && (
                    <>
                      <span className={level === 0 ? 'menu-item-text' : ''}>
                        {item.name}
                      </span>

                      <span className="flex items-center gap-1 ml-auto">
                        {item.new && (
                          <span
                            className={`ml-auto ${
                              leafActive && level > 0
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
                              leafActive && level > 0
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
            </li>
          );
        }

        return null;
      })}
    </ul>
  );
};

export default MenuRenderer;
