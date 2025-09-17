'use client';

import React, { ReactNode } from 'react';
import { PermissionProvider } from '@/hooks/usePermissions';

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <PermissionProvider>
      {children}
    </PermissionProvider>
  );
};

export default AppProviders;