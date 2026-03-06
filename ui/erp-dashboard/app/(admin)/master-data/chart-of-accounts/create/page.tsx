"use client";

import { useSearchParams } from "next/navigation";
import ChartOfAccountForm from "@/components/master-data/chart-of-accounts/ChartOfAccountForm";

export default function CreateChartOfAccountPage() {
  const searchParams = useSearchParams();
  const defaultParentId = searchParams?.get("parent_id") ?? undefined;

  return <ChartOfAccountForm mode="create" defaultParentId={defaultParentId} />;
}
