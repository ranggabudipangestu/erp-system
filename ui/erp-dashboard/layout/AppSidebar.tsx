"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { HorizontaLDots } from "@/icons/index";
import { useMenuData } from "@/hooks/useMenuData";
import MenuRenderer from "@/components/menu/MenuRenderer";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { menuData, loading, error } = useMenuData();

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const handleSubmenuToggle = (itemId: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Auto-expand active menu items on pathname change
  useEffect(() => {
    if (!menuData) return;

    const findActiveMenus = (items: any[], activeMenus: string[] = []): string[] => {
      for (const item of items) {
        if (item.path === pathname) {
          return activeMenus;
        }
        if (item.children) {
          const foundPath = findActiveMenus(item.children, [...activeMenus, item.id]);
          if (foundPath.length > activeMenus.length) {
            return foundPath;
          }
        }
      }
      return activeMenus;
    };

    const mainActiveMenus = findActiveMenus(menuData.mainMenu);
    const otherActiveMenus = findActiveMenus(menuData.otherMenu);
    const allActiveMenus = [...mainActiveMenus, ...otherActiveMenus];

    if (allActiveMenus.length > 0) {
      const newOpenSubmenus: Record<string, boolean> = {};
      allActiveMenus.forEach(menuId => {
        newOpenSubmenus[menuId] = true;
      });
      setOpenSubmenus(prev => ({ ...prev, ...newOpenSubmenus }));
    }
  }, [pathname, menuData]);

  if (loading) {
    return (
      <aside className="fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 w-[290px] h-screen border-r border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading menu...</div>
        </div>
      </aside>
    );
  }

  if (error || !menuData) {
    return (
      <aside className="fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 w-[290px] h-screen border-r border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">Error loading menu</div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={48}
                height={48}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={48}
                height={48}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              <MenuRenderer
                items={menuData.mainMenu}
                isExpanded={isExpanded}
                isHovered={isHovered}
                isMobileOpen={isMobileOpen}
                openSubmenus={openSubmenus}
                onSubmenuToggle={handleSubmenuToggle}
              />
            </div>

            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              <MenuRenderer
                items={menuData.otherMenu}
                isExpanded={isExpanded}
                isHovered={isHovered}
                isMobileOpen={isMobileOpen}
                openSubmenus={openSubmenus}
                onSubmenuToggle={handleSubmenuToggle}
              />
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
