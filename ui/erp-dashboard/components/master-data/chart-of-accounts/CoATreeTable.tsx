"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, Edit2, Archive, Plus } from "lucide-react";
import type { ChartOfAccountTreeDto } from "@/types/chart-of-accounts";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_COLORS,
} from "@/types/chart-of-accounts";

interface CoATreeTableProps {
  data: ChartOfAccountTreeDto[];
  loading?: boolean;
  onEdit: (account: ChartOfAccountTreeDto) => void;
  onArchive: (account: ChartOfAccountTreeDto) => void;
  onAddChild: (parent: ChartOfAccountTreeDto) => void;
}

interface TreeRowProps {
  account: ChartOfAccountTreeDto;
  onEdit: (account: ChartOfAccountTreeDto) => void;
  onArchive: (account: ChartOfAccountTreeDto) => void;
  onAddChild: (parent: ChartOfAccountTreeDto) => void;
  defaultExpanded?: boolean;
}

function TreeRow({
  account,
  onEdit,
  onArchive,
  onAddChild,
  defaultExpanded = true,
}: TreeRowProps) {
  const [expanded, setExpanded] = useState(
    defaultExpanded && account.level <= 1,
  );
  const hasChildren = account.children && account.children.length > 0;
  const canAddChild = account.level < 3;

  const indent = (account.level - 1) * 24;

  const levelStyle =
    account.level === 1
      ? "font-bold text-gray-900 dark:text-gray-100"
      : account.level === 2
        ? "font-medium text-gray-800 dark:text-gray-200"
        : "text-gray-700 dark:text-gray-300";

  return (
    <>
      <tr
        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
          !account.is_active ? "opacity-50" : ""
        }`}
      >
        {/* Code + Name */}
        <td className="py-3 pr-4">
          <div
            className="flex items-center gap-1"
            style={{ paddingLeft: `${indent}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <div>
              <span className={`font-mono text-sm ${levelStyle}`}>
                {account.code}
              </span>
              <span className={`ml-2 text-sm ${levelStyle}`}>
                {account.name}
              </span>
            </div>
          </div>
        </td>

        {/* Account Type */}
        <td className="py-3 pr-4">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              ACCOUNT_TYPE_COLORS[account.account_type]
            }`}
          >
            {ACCOUNT_TYPE_LABELS[account.account_type]}
          </span>
        </td>

        {/* Normal Balance */}
        <td className="py-3 pr-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {account.normal_balance}
          </span>
        </td>

        {/* Level */}
        <td className="py-3 pr-4">
          <span className="text-xs text-gray-400">Level {account.level}</span>
        </td>

        {/* Status */}
        <td className="py-3 pr-4">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              account.is_active
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {account.is_active ? "Active" : "Inactive"}
          </span>
        </td>

        {/* Actions */}
        <td className="py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            {canAddChild && (
              <button
                onClick={() => onAddChild(account)}
                title="Add child account"
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-brand-600 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => onEdit(account)}
              title="Edit"
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onArchive(account)}
              title="Archive"
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600 transition-colors"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Children */}
      {expanded &&
        hasChildren &&
        account.children.map((child) => (
          <TreeRow
            key={child.id}
            account={child}
            onEdit={onEdit}
            onArchive={onArchive}
            onAddChild={onAddChild}
            defaultExpanded={defaultExpanded}
          />
        ))}
    </>
  );
}

export default function CoATreeTable({
  data,
  loading,
  onEdit,
  onArchive,
  onAddChild,
}: CoATreeTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <svg
          className="animate-spin h-6 w-6 mr-2"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        Loading data...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
        No accounts yet. Click &quot;Add Account&quot; to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="pb-3 text-left font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              Code / Account Name
            </th>
            <th className="pb-3 text-left font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              Type
            </th>
            <th className="pb-3 text-left font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              Normal Balance
            </th>
            <th className="pb-3 text-left font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              Level
            </th>
            <th className="pb-3 text-left font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              Status
            </th>
            <th className="pb-3 text-right font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((account) => (
            <TreeRow
              key={account.id}
              account={account}
              onEdit={onEdit}
              onArchive={onArchive}
              onAddChild={onAddChild}
              defaultExpanded
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
