"use client";

import { use } from "react";
import ProductCategoryForm from "@/components/master-data/product-categories/ProductCategoryForm";

export default function EditProductCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ProductCategoryForm mode="edit" categoryId={id} />;
}
