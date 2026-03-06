import UnitForm from "@/components/master-data/units/UnitForm";

export const metadata = {
  title: "Create Unit - ERP System",
  description: "Create a new unit of measurement.",
};

export default function CreateUnitPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <UnitForm mode="create" />
    </div>
  );
}
