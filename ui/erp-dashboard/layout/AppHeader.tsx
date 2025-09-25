"use client";

import UserDropdown from "@/components/header/UserDropdown";
import React from "react";

const AppHeader: React.FC = () => {
  
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-end px-3 py-3 sm:px-4 lg:pr-6 lg:py-4">
        <UserDropdown />
      </div>
    </header>
  );
};

export default AppHeader;
