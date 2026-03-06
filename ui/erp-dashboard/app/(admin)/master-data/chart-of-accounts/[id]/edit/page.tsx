"use client";

import { use } from "react";
import ChartOfAccountForm from "@/components/master-data/chart-of-accounts/ChartOfAccountForm";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function EditChartOfAccountPage({ params }: EditPageProps) {
  const { id } = use(params);
  return <ChartOfAccountForm mode="edit" accountId={id} />;
}
