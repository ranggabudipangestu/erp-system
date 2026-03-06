import { Metadata } from "next";
import UnitForm from "@/components/master-data/units/UnitForm";

export const metadata: Metadata = {
  title: "Edit Unit - ERP System",
  description: "Update unit details.",
};

interface EditUnitPageProps {
  params: {
    id: string;
  };
}

export default function EditUnitPage({ params }: EditUnitPageProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <UnitForm mode="edit" unitId={params.id} />
    </div>
  );
}
