"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { HorizontaLDots } from "@/icons/index";
import { useMenuData } from "@/hooks/useMenuData";
import MenuRenderer from "@/components/menu/MenuRenderer";
import { getIconComponent } from "@/utils/iconMapper";

const AppSidebar: React.FC = () => {
  const { isMobileOpen, isCollapsed, isMobile } = useSidebar();
  const pathname = usePathname();
  const { menuData, loading, error } = useMenuData();

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [mobileActiveModuleId, setMobileActiveModuleId] = useState<string | null>(null);

  const mobileNavRef = useRef<HTMLElement | null>(null);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);

  const handleSubmenuToggle = (itemId: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleModuleClick = (moduleId: string) => {
    setActiveModuleId((prev) => (prev === moduleId ? null : moduleId));
  };

  const closeModulePanel = () => setActiveModuleId(null);

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

    const allActiveMenus = [
      ...findActiveMenus(menuData.mainMenu),
      ...findActiveMenus(menuData.otherMenu),
    ];

    if (allActiveMenus.length > 0) {
      const newOpenSubmenus: Record<string, boolean> = {};
      allActiveMenus.forEach((menuId) => {
        newOpenSubmenus[menuId] = true;
      });
      setOpenSubmenus((prev) => ({ ...prev, ...newOpenSubmenus }));
    }
  }, [pathname, menuData]);

  useEffect(() => {
    closeModulePanel();
  }, [pathname, isMobileOpen, isCollapsed]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const panel = document.getElementById("sidebar-module-panel");
      const sidebar = document.getElementById("app-sidebar");
      if (!panel || !sidebar) return;

      if (
        !panel.contains(event.target as Node) &&
        !sidebar.contains(event.target as Node)
      ) {
        closeModulePanel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeModule = menuData?.mainMenu.find(
    (module) => module.id === activeModuleId
  );

  useEffect(() => {
    if (!isMobile || !mobileActiveModuleId) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const navEl = mobileNavRef.current;
      const panelEl = mobilePanelRef.current;

      if (!panelEl) return;

      const clickedInsidePanel = panelEl.contains(target);
      const clickedInsideNav = navEl?.contains(target) ?? false;

      if (!clickedInsidePanel && !clickedInsideNav) {
        setMobileActiveModuleId(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isMobile, mobileActiveModuleId]);

  if (loading) {
    return (
      <aside
        id="app-sidebar"
        className="fixed top-0 left-0 mt-16 flex h-screen w-[290px] flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:mt-0"
      >
        <div className="flex h-full items-center justify-center">
          <div className="text-gray-500">Loading menu...</div>
        </div>
      </aside>
    );
  }

  if (error || !menuData) {
    return (
      <aside
        id="app-sidebar"
        className="fixed top-0 left-0 mt-16 flex h-screen w-[290px] flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:mt-0"
      >
        <div className="flex h-full items-center justify-center">
          <div className="text-red-500">Error loading menu</div>
        </div>
      </aside>
    );
  }

  if (isMobile) {
    const mobileActiveModule = menuData.mainMenu.find(
      (module) => module.id === mobileActiveModuleId,
    );

    return (
      <>
        <nav
          ref={mobileNavRef}
          className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
        >
          {menuData.mainMenu.map((module) => {
            const Icon = module.icon ? getIconComponent(module.icon) : null;
            const isActive = module.children?.some((child) => child.path === pathname);
            return (
              <button
                key={module.id}
                onClick={() =>
                  setMobileActiveModuleId((prev) =>
                    prev === module.id ? null : module.id,
                  )
                }
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                  mobileActiveModuleId === module.id
                    ? "bg-brand-500/10 text-brand-600"
                    : isActive
                    ? "bg-brand-100 text-brand-600"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300"
                }`}
                aria-label={module.name}
              >
                {Icon ? Icon : <HorizontaLDots className="h-5 w-5" />}
              </button>
            );
          })}
        </nav>

        {mobileActiveModule && (
          <div
            ref={mobilePanelRef}
            className="fixed bottom-16 left-0 right-0 z-40 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-lg"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-xs uppercase text-gray-400">Select</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {mobileActiveModule.name}
                </p>
              </div>
              <button
                onClick={() => setMobileActiveModuleId(null)}
                className="text-sm transition hover:underline text-blue-700"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 px-4 pb-4">
              {mobileActiveModule.children?.map((child) => {
                const ChildIcon = child.icon ? getIconComponent(child.icon) : null;
                return (
                  <Link
                    href={child.path ?? "#"}
                    key={child.id}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center text-xs transition ${
                      child.path === pathname
                        ? "border-brand-500 bg-brand-500/10 text-brand-600"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                    onClick={() => setMobileActiveModuleId(null)}
                  >
                    <span className="flex h-8 w-8 items-center justify-center text-lg">
                      {ChildIcon || <HorizontaLDots className="h-5 w-5" />}
                    </span>
                    <span className="line-clamp-2">{child.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  }

  const renderExpandedSidebar = () => (
    <aside
      id="app-sidebar"
      className="fixed top-0 left-0 mt-16 flex h-screen w-[290px] flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:mt-0"
    >
      <div className="px-5 py-8">
        <Link href="/">
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
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto px-5">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="mb-4 text-xs uppercase leading-[20px] text-gray-400">
                Menu
              </h2>
              <MenuRenderer
                items={menuData.mainMenu}
                isExpanded
                isHovered={false}
                isMobileOpen={isMobileOpen}
                openSubmenus={openSubmenus}
                onSubmenuToggle={handleSubmenuToggle}
              />
            </div>
            <div>
              <MenuRenderer
                items={menuData.otherMenu}
                isExpanded
                isHovered={false}
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

  if (isMobileOpen || !isCollapsed) {
    return renderExpandedSidebar();
  }

  return (
    <>
      <aside
        id="app-sidebar"
        className="fixed top-0 left-0 mt-16 flex h-screen w-[84px] flex-col items-center border-r border-gray-200 bg-white transition-all dark:border-gray-800 dark:bg-gray-900 lg:mt-0"
      >
        <div className="py-6">
          <Link href="/">
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={40}
              height={40}
            />
          </Link>
        </div>
        <nav className="mt-4 flex flex-col items-center gap-4">
          {menuData.mainMenu.map((module) => {
            const Icon = module.icon ? getIconComponent(module.icon) : null;
            const isActive = module.children?.some((child) => child.path === pathname);
            return (
              <div key={module.id} className="group relative">
                <button
                  onClick={() => handleModuleClick(module.id)}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
                    activeModuleId === module.id
                      ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10"
                      : isActive
                      ? "border-brand-200 bg-brand-50 text-brand-600"
                      : "border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                  aria-label={module.name}
                >
                  {Icon ? Icon : <HorizontaLDots className="h-5 w-5" />}
                </button>
                <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
                  {module.name}
                </span>
              </div>
            );
          })}
        </nav>
      </aside>

      {activeModule && (
        <div
          id="sidebar-module-panel"
          className="fixed top-16 left-[84px] z-40 h-[calc(100vh-64px)] w-72 border-l border-r border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                {activeModule.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Select a page</p>
            </div>
            <button
              onClick={closeModulePanel}
              className="text-sm text-gray-400 transition hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="h-full overflow-y-auto px-5 py-4">
            <ul className="space-y-2">
              {activeModule.children?.map((child) => {
                const isActiveChild = child.path === pathname;
                const childIcon = getIconComponent(child.icon);

                return (
                  <li key={child.id}>
                    <Link
                      href={child.path ?? "#"}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActiveChild
                          ? "bg-brand-500 text-white"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                      }`}
                      onClick={closeModulePanel}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                          isActiveChild
                            ? "text-white"
                            : "text-gray-400 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-200"
                        }`}
                        aria-hidden="true"
                      >
                        {childIcon}
                      </span>
                      <span className="truncate">{child.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default AppSidebar;
