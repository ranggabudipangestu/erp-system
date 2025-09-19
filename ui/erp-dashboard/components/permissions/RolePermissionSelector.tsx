'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NavigationModule } from '@/types/permissions';

export type PermissionSelection = {
  menu_item_id: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
};

export type PermissionMap = Record<string, PermissionSelection>;

type PermissionKey = keyof Pick<PermissionSelection, 'can_view' | 'can_create' | 'can_edit' | 'can_delete' | 'can_export'>;

const createEmptySelection = (menuItemId: string): PermissionSelection => ({
  menu_item_id: menuItemId,
  can_view: false,
  can_create: false,
  can_edit: false,
  can_delete: false,
  can_export: false,
});

const hasAnyPermission = (selection: PermissionSelection) =>
  selection.can_view || selection.can_create || selection.can_edit || selection.can_delete || selection.can_export;

interface RolePermissionSelectorProps {
  modules: NavigationModule[];
  value: PermissionMap;
  onChange: React.Dispatch<React.SetStateAction<PermissionMap>>;
  disabled?: boolean;
}

const RolePermissionSelector: React.FC<RolePermissionSelectorProps> = ({ modules, value, onChange, disabled = false }) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(modules.map((module) => module.id)));

  useEffect(() => {
    setExpandedModules(new Set(modules.map((module) => module.id)));
  }, [modules]);

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const toggleItemPermission = (menuItemId: string, key: PermissionKey) => {
    onChange((prev) => {
      const current = prev[menuItemId] ?? createEmptySelection(menuItemId);
      const toggledValue = !current[key];

      let nextState: PermissionSelection = {
        ...current,
        [key]: toggledValue,
      };

      if (key !== 'can_view' && toggledValue) {
        nextState.can_view = true;
      }

      if (key === 'can_view' && !toggledValue) {
        nextState = {
          ...nextState,
          can_create: false,
          can_edit: false,
          can_delete: false,
          can_export: false,
        };
      }

      if (!hasAnyPermission(nextState)) {
        const { [menuItemId]: _unused, ...rest } = prev;
        return rest;
      }

      return { ...prev, [menuItemId]: nextState };
    });
  };

  const applyModuleAction = (module: NavigationModule, action: 'view' | 'full' | 'clear') => {
    onChange((prev) => {
      const next = { ...prev };
      module.items.forEach((item) => {
        if (action === 'clear') {
          delete next[item.id];
          return;
        }

        next[item.id] = {
          menu_item_id: item.id,
          can_view: true,
          can_create: action === 'full',
          can_edit: action === 'full',
          can_delete: action === 'full',
          can_export: action === 'full',
        };
      });
      return next;
    });
  };

  const getModuleStats = (module: NavigationModule, key: PermissionKey) => {
    const total = module.items.length;
    const enabled = module.items.filter((item) => (value[item.id] ?? createEmptySelection(item.id))[key]).length;
    return { total, enabled };
  };

  return (
    <div className="space-y-4">
      {modules.map((module) => {
        const isExpanded = expandedModules.has(module.id);
        const viewStats = getModuleStats(module, 'can_view');
        const manageStats = getModuleStats(module, 'can_edit');

        return (
          <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => toggleModuleExpansion(module.id)}
                className="flex items-center gap-2 text-left"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                <span className="text-sm font-medium text-gray-900 dark:text-white">{module.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">({module.items.length} items)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyModuleAction(module, 'view')}
                  disabled={disabled}
                  className="text-xs px-3 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  View all
                </button>
                <button
                  type="button"
                  onClick={() => applyModuleAction(module, 'full')}
                  disabled={disabled}
                  className="text-xs px-3 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Full access
                </button>
                <button
                  type="button"
                  onClick={() => applyModuleAction(module, 'clear')}
                  disabled={disabled}
                  className="text-xs px-3 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-white dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Resource</th>
                      {(['can_view', 'can_create', 'can_edit', 'can_delete', 'can_export'] as const).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                        >
                          {key.replace('can_', '')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {module.items.map((item) => {
                      const selection = value[item.id] ?? createEmptySelection(item.id);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{item.permission_key}</div>
                          </td>
                          {(['can_view', 'can_create', 'can_edit', 'can_delete', 'can_export'] as const).map((key) => (
                            <td key={key} className="px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                checked={selection[key]}
                                onChange={() => toggleItemPermission(item.id, key)}
                                disabled={disabled}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                  <span>
                    View enabled on {viewStats.enabled}/{viewStats.total} • Edit rights on {manageStats.enabled}/{manageStats.total}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RolePermissionSelector;
