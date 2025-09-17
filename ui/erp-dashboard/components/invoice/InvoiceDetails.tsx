import React from 'react';
import CalendarDatePicker from '@/components/ui/CalendarDatePicker';

type InvoiceData = {
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  customerEmail: string;
  invoiceDate: string;
  dueDate: string;
  notes: string;
  products: Array<{
    id: string;
    name: string;
    description: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  shippingCost: number;
  additionalFees: number;
  taxRate: number;
  discountAmount: number;
};

interface InvoiceDetailsProps {
  invoiceData: InvoiceData;
  updateInvoiceData: (data: Partial<InvoiceData>) => void;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  invoiceData,
  updateInvoiceData,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-black dark:text-white mb-4">
          Invoice Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Invoice Number
            </label>
            <input
              type="text"
              placeholder="Enter invoice number"
              value={invoiceData.invoiceNumber}
              onChange={(e) => updateInvoiceData({ invoiceNumber: e.target.value })}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          <div>
            <CalendarDatePicker
              label="Invoice Date"
              value={invoiceData.invoiceDate}
              onChange={(date) => updateInvoiceData({ invoiceDate: date })}
              placeholder="Select invoice date"
              required
            />
          </div>

          <div>
            <CalendarDatePicker
              label="Due Date"
              value={invoiceData.dueDate}
              onChange={(date) => updateInvoiceData({ dueDate: date })}
              placeholder="Select due date"
              minDate={invoiceData.invoiceDate || new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-black dark:text-white mb-4">
          Customer Information
        </h3>
        <div className="space-y-6">
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Customer Name
            </label>
            <input
              type="text"
              placeholder="Enter customer name"
              value={invoiceData.customerName}
              onChange={(e) => updateInvoiceData({ customerName: e.target.value })}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Customer Email
            </label>
            <input
              type="email"
              placeholder="Enter customer email"
              value={invoiceData.customerEmail}
              onChange={(e) => updateInvoiceData({ customerEmail: e.target.value })}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Customer Address
            </label>
            <textarea
              rows={4}
              placeholder="Enter customer address"
              value={invoiceData.customerAddress}
              onChange={(e) => updateInvoiceData({ customerAddress: e.target.value })}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            ></textarea>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Notes
            </label>
            <textarea
              rows={3}
              placeholder="Enter additional notes (optional)"
              value={invoiceData.notes}
              onChange={(e) => updateInvoiceData({ notes: e.target.value })}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;