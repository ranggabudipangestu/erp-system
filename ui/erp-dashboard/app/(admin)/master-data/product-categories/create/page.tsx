"use client";

import { useSearchParams } from "next/navigation";
import ProductCategoryForm from "@/components/master-data/product-categories/ProductCategoryForm";

export default function CreateProductCategoryPage() {
  const searchParams = useSearchParams();
  const parentId = searchParams?.get("parent_id") || undefined;
  return <ProductCategoryForm mode="create" defaultParentId={parentId} />;
}
