import React from 'react';

// Re-export ActionDropdown
export { default as ActionDropdown } from './ActionDropdown';
export type { ActionItem } from './ActionDropdown';

// Helper component for rendering badges/status
export const StatusBadge: React.FC<{
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}> = ({ status, variant = 'default' }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getVariantClasses()}`}
    >
      {status}
    </span>
  );
};

// Helper component for rendering user info with avatar
export const UserInfo: React.FC<{
  name: string;
  email?: string;
  role?: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ name, email, role, avatar, size = 'md' }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8 text-xs';
      case 'lg':
        return 'h-12 w-12 text-base';
      default:
        return 'h-10 w-10 text-sm';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-shrink-0 ${getSizeClasses()}`}>
        {avatar ? (
          <img
            className={`${getSizeClasses()} rounded-full object-cover`}
            src={avatar}
            alt={name}
          />
        ) : (
          <div className={`${getSizeClasses()} rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-medium text-gray-700 dark:text-gray-200`}>
            {getInitials(name)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {name}
        </div>
        {email && (
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {email}
          </div>
        )}
        {role && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {role}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for rendering action buttons
export const ActionButtons: React.FC<{
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  size?: 'sm' | 'md';
}> = ({ actions, size = 'sm' }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'md':
        return 'px-4 py-2 text-sm';
      default:
        return 'px-3 py-1 text-xs';
    }
  };

  const getVariantClasses = (variant: string = 'secondary') => {
    const baseClasses = `inline-flex items-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getSizeClasses()}`;
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
      case 'success':
        return `${baseClasses} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`;
      case 'warning':
        return `${baseClasses} bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500`;
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
      default:
        return `${baseClasses} bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500`;
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          disabled={action.disabled}
          className={getVariantClasses(action.variant)}
        >
          {action.icon && <span className="mr-1">{action.icon}</span>}
          {action.label}
        </button>
      ))}
    </div>
  );
};

// Helper component for rendering currency
export const CurrencyDisplay: React.FC<{
  amount: number;
  currency?: string;
  locale?: string;
}> = ({ amount, currency = 'USD', locale = 'en-US' }) => {
  const formattedAmount = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);

  return <span className="font-medium text-gray-900 dark:text-gray-100">{formattedAmount}</span>;
};

// Helper component for rendering date
export const DateDisplay: React.FC<{
  date: string | Date;
  format?: 'short' | 'medium' | 'long' | 'relative';
  locale?: string;
}> = ({ date, format = 'short', locale = 'en-US' }) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formatDate = () => {
    switch (format) {
      case 'relative':
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - dateObj.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
      
      case 'long':
        return dateObj.toLocaleDateString(locale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'medium':
        return dateObj.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      
      default:
        return dateObj.toLocaleDateString(locale);
    }
  };

  return <span className="text-gray-900 dark:text-gray-100">{formatDate()}</span>;
};

// Helper component for rendering tags
export const TagList: React.FC<{
  tags: string[];
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  maxDisplay?: number;
}> = ({ tags, variant = 'default', maxDisplay }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags;
  const hiddenCount = maxDisplay && tags.length > maxDisplay ? tags.length - maxDisplay : 0;

  return (
    <div className="flex flex-wrap gap-1">
      {displayTags.map((tag, index) => (
        <span
          key={index}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVariantClasses()}`}
        >
          {tag}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          +{hiddenCount} more
        </span>
      )}
    </div>
  );
};