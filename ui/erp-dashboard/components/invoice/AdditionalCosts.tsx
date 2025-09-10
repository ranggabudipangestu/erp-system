import React from 'react';

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

interface Step3AdditionalCostsProps {
  invoiceData: InvoiceData;
  updateInvoiceData: (data: Partial<InvoiceData>) => void;
}

const Step3AdditionalCosts: React.FC<Step3AdditionalCostsProps> = ({
  invoiceData,
  updateInvoiceData,
}) => {
  const subtotal = invoiceData.products.reduce((sum, product) => sum + product.total, 0);
  const taxAmount = (subtotal + invoiceData.shippingCost + invoiceData.additionalFees) * (invoiceData.taxRate / 100);
  const totalAmount = subtotal + invoiceData.shippingCost + invoiceData.additionalFees + taxAmount - invoiceData.discountAmount;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-black dark:text-white mb-4">
          Additional Costs & Tax Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Shipping Cost
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={invoiceData.shippingCost || ''}
                onChange={(e) => updateInvoiceData({ shippingCost: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent pl-8 pr-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Additional Fees
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={invoiceData.additionalFees || ''}
                onChange={(e) => updateInvoiceData({ additionalFees: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent pl-8 pr-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Tax Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0.00"
                value={invoiceData.taxRate || ''}
                onChange={(e) => updateInvoiceData({ taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Discount Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={invoiceData.discountAmount || ''}
                onChange={(e) => updateInvoiceData({ discountAmount: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent pl-8 pr-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown Summary */}
      <div className="border border-stroke rounded-lg p-6 bg-gray-50 dark:border-strokedark dark:bg-meta-4">
        <h4 className="text-lg font-medium text-black dark:text-white mb-4">
          Cost Breakdown
        </h4>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-black dark:text-white">Products Subtotal:</span>
            <span className="font-medium text-black dark:text-white">
              ${subtotal.toFixed(2)}
            </span>
          </div>
          
          {invoiceData.shippingCost > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-black dark:text-white">Shipping Cost:</span>
              <span className="font-medium text-black dark:text-white">
                ${invoiceData.shippingCost.toFixed(2)}
              </span>
            </div>
          )}
          
          {invoiceData.additionalFees > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-black dark:text-white">Additional Fees:</span>
              <span className="font-medium text-black dark:text-white">
                ${invoiceData.additionalFees.toFixed(2)}
              </span>
            </div>
          )}
          
          {invoiceData.taxRate > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-black dark:text-white">
                Tax ({invoiceData.taxRate}%):
              </span>
              <span className="font-medium text-black dark:text-white">
                ${taxAmount.toFixed(2)}
              </span>
            </div>
          )}
          
          {invoiceData.discountAmount > 0 && (
            <div className="flex justify-between items-center text-green-600">
              <span>Discount:</span>
              <span className="font-medium">
                -${invoiceData.discountAmount.toFixed(2)}
              </span>
            </div>
          )}
          
          <div className="border-t border-stroke pt-3 dark:border-strokedark">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-black dark:text-white">
                Total Amount:
              </span>
              <span className="text-xl font-bold text-primary">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3AdditionalCosts;