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

interface Step4ReviewProps {
  invoiceData: InvoiceData;
  onSave: () => void;
  onPrevious: () => void;
}

const Step4Review: React.FC<Step4ReviewProps> = ({
  invoiceData,
  onSave,
  onPrevious,
}) => {
  const subtotal = invoiceData.products.reduce((sum, product) => sum + product.total, 0);
  const taxAmount = (subtotal + invoiceData.shippingCost + invoiceData.additionalFees) * (invoiceData.taxRate / 100);
  const totalAmount = subtotal + invoiceData.shippingCost + invoiceData.additionalFees + taxAmount - invoiceData.discountAmount;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-black dark:text-white mb-6">
          Review & Confirm Invoice
        </h3>

        {/* Invoice Details Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="border border-stroke rounded-lg p-6 dark:border-strokedark">
            <h4 className="font-semibold text-black dark:text-white mb-4">
              Invoice Information
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Invoice Number:</span>
                <span className="font-medium text-black dark:text-white">
                  {invoiceData.invoiceNumber || 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Invoice Date:</span>
                <span className="font-medium text-black dark:text-white">
                  {invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString() : 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Due Date:</span>
                <span className="font-medium text-black dark:text-white">
                  {invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-stroke rounded-lg p-6 dark:border-strokedark">
            <h4 className="font-semibold text-black dark:text-white mb-4">
              Customer Information
            </h4>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600 dark:text-gray-400 block">Customer Name:</span>
                <span className="font-medium text-black dark:text-white">
                  {invoiceData.customerName || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400 block">Email:</span>
                <span className="font-medium text-black dark:text-white">
                  {invoiceData.customerEmail || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400 block">Address:</span>
                <span className="font-medium text-black dark:text-white">
                  {invoiceData.customerAddress || 'Not specified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Summary */}
        <div className="border border-stroke rounded-lg p-6 dark:border-strokedark mb-6">
          <h4 className="font-semibold text-black dark:text-white mb-4">
            Products & Services ({invoiceData.products.length} items)
          </h4>
          
          {invoiceData.products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stroke dark:border-strokedark">
                    <th className="text-left py-3 font-medium text-black dark:text-white">Product</th>
                    <th className="text-right py-3 font-medium text-black dark:text-white">Qty</th>
                    <th className="text-right py-3 font-medium text-black dark:text-white">Price</th>
                    <th className="text-right py-3 font-medium text-black dark:text-white">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.products.map((product) => (
                    <tr key={product.id} className="border-b border-stroke dark:border-strokedark">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-black dark:text-white">
                            {product.name || 'Unnamed Product'}
                          </p>
                          {product.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right text-black dark:text-white">
                        {product.quantity}
                      </td>
                      <td className="py-3 text-right text-black dark:text-white">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-medium text-black dark:text-white">
                        ${product.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No products added
            </p>
          )}
        </div>

        {/* Final Cost Summary */}
        <div className="border border-stroke rounded-lg p-6 bg-gray-50 dark:border-strokedark dark:bg-meta-4">
          <h4 className="font-semibold text-black dark:text-white mb-4">
            Invoice Total
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-black dark:text-white">Subtotal:</span>
              <span className="font-medium text-black dark:text-white">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            
            {invoiceData.shippingCost > 0 && (
              <div className="flex justify-between">
                <span className="text-black dark:text-white">Shipping:</span>
                <span className="font-medium text-black dark:text-white">
                  ${invoiceData.shippingCost.toFixed(2)}
                </span>
              </div>
            )}
            
            {invoiceData.additionalFees > 0 && (
              <div className="flex justify-between">
                <span className="text-black dark:text-white">Additional Fees:</span>
                <span className="font-medium text-black dark:text-white">
                  ${invoiceData.additionalFees.toFixed(2)}
                </span>
              </div>
            )}
            
            {invoiceData.taxRate > 0 && (
              <div className="flex justify-between">
                <span className="text-black dark:text-white">
                  Tax ({invoiceData.taxRate}%):
                </span>
                <span className="font-medium text-black dark:text-white">
                  ${taxAmount.toFixed(2)}
                </span>
              </div>
            )}
            
            {invoiceData.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span className="font-medium">
                  -${invoiceData.discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            
            <div className="border-t border-stroke pt-3 dark:border-strokedark">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-black dark:text-white">
                  Grand Total:
                </span>
                <span className="text-2xl font-bold text-primary">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoiceData.notes && (
          <div className="border border-stroke rounded-lg p-6 dark:border-strokedark">
            <h4 className="font-semibold text-black dark:text-white mb-3">
              Additional Notes
            </h4>
            <p className="text-black dark:text-white">
              {invoiceData.notes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
          <button
            type="button"
            onClick={onPrevious}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-center font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white hover:bg-blue-700"
          >
            Save Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step4Review;