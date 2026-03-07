import { Metadata } from "next";
import CurrencyForm from "@/components/master-data/currencies/CurrencyForm";

export const metadata: Metadata = {
  title: "Create Currency - ERP Dashboard",
  description: "Create a new currency",
};

export default function CreateCurrencyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Create Currency
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add a new currency for reporting and transactions.
        </p>
      </div>

      <CurrencyForm mode="create" />
    </div>
  );
}
