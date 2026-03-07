import { Metadata } from "next";
import CurrencyForm from "@/components/master-data/currencies/CurrencyForm";

export const metadata: Metadata = {
  title: "Edit Currency - ERP Dashboard",
  description: "Edit currency details",
};

interface EditCurrencyPageProps {
  params: {
    id: string;
  };
}

export default function EditCurrencyPage({ params }: EditCurrencyPageProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Edit Currency
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update currency details and exchange rates.
        </p>
      </div>

      <CurrencyForm mode="edit" currencyId={params.id} />
    </div>
  );
}
