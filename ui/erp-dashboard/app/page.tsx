'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth';

// Import admin layout and dashboard components
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import DemographicCard from "@/components/ecommerce/DemographicCard";

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  useEffect(() => {
    // Check authentication status
    const authenticated = AuthService.isAuthenticated();
    setIsAuthenticated(authenticated);
    
    if (!authenticated) {
      // User is not authenticated, redirect to login
      router.push('/login');
    }
  }, [router]);

  // Still checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // User is not authenticated, show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  // User is authenticated, show dashboard with admin layout
  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-7">
              <EcommerceMetrics />
              <MonthlySalesChart />
            </div>

            <div className="col-span-12 xl:col-span-5">
              <MonthlyTarget />
            </div>

            <div className="col-span-12">
              <StatisticsChart />
            </div>

            <div className="col-span-12 xl:col-span-5">
              <DemographicCard />
            </div>

            <div className="col-span-12 xl:col-span-7">
              <RecentOrders />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}