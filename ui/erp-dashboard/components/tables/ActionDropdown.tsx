'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface ActionItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  disabled?: boolean;
  divider?: boolean; // Add divider after this item
}

interface ActionDropdownProps {
  actions: ActionItem[];
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
}

export default function ActionDropdown({ actions, size = 'sm', align = 'right' }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);


  const getSizeClasses = () => {
    switch (size) {
      case 'md':
        return 'h-8 w-8';
      default:
        return 'h-6 w-6';
    }
  };

  const getVariantClasses = (variant: string = 'default') => {
    switch (variant) {
      case 'danger':
        return 'text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20';
      case 'warning':
        return 'text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20';
      case 'success':
        return 'text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20';
      default:
        return 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700';
    }
  };

  const handleActionClick = (action: ActionItem) => {
    if (!action.disabled) {
      action.onClick();
      setIsOpen(false);
    }
  };

  const getDropdownPositionClasses = () => {
    return align === 'left' ? 'left-0 mt-2' : 'right-0 mt-2';
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors ${getSizeClasses()}`}
        aria-expanded="true"
        aria-haspopup="true"
      >
        <span className="sr-only">Open options</span>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-56 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${getDropdownPositionClasses()}`}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {actions.map((action, index) => (
              <React.Fragment key={index}>
                <button
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  className={`group flex w-full items-center px-4 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getVariantClasses(action.variant)}`}
                  role="menuitem"
                >
                  {action.icon && (
                    <span className="mr-3 h-4 w-4 flex-shrink-0" aria-hidden="true">
                      {action.icon}
                    </span>
                  )}
                  {action.label}
                </button>
                {action.divider && index < actions.length - 1 && (
                  <div className="border-t border-gray-100 dark:border-gray-700" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}