import React from 'react';
import ProductManager, { Product } from '@/components/common/ProductManager';

type InvoiceData = {
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  customerEmail: string;
  invoiceDate: string;
  dueDate: string;
  notes: string;
  products: Product[];
  shippingCost: number;
  additionalFees: number;
  taxRate: number;
  discountAmount: number;
};

interface AddProductsProps {
  invoiceData: InvoiceData;
  updateInvoiceData: (data: Partial<InvoiceData>) => void;
}

const AddProducts: React.FC<AddProductsProps> = ({
  invoiceData,
  updateInvoiceData,
}) => {
  const handleProductsChange = (products: Product[]) => {
    updateInvoiceData({ products });
  };

  return (
    <ProductManager
      products={invoiceData.products}
      onProductsChange={handleProductsChange}
      title="Products & Services"
      showSubtotal={true}
    />
  );
};

export default AddProducts;