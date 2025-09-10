# ProductManager Component Usage Examples

The `ProductManager` is a flexible, reusable component for managing products across different modules in the ERP system.

## Basic Usage (Invoice)

```typescript
import ProductManager, { Product } from '@/components/common/ProductManager';

const InvoiceProducts = ({ invoiceData, updateInvoiceData }) => {
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
```

## Sales Order Usage

```typescript
const SalesOrderProducts = ({ orderData, updateOrderData }) => {
  const handleProductsChange = (products: Product[]) => {
    updateOrderData({ products });
  };

  const handleProductAdd = (product: Product) => {
    console.log('Product added to sales order:', product);
    // Custom logic for sales orders
  };

  return (
    <ProductManager
      products={orderData.products}
      onProductsChange={handleProductsChange}
      title="Order Items"
      showSubtotal={true}
      onProductAdd={handleProductAdd}
      onProductUpdate={(product) => console.log('Updated:', product)}
      onProductDelete={(id) => console.log('Deleted:', id)}
    />
  );
};
```

## Purchase Order Usage

```typescript
const PurchaseOrderProducts = ({ purchaseData, updatePurchaseData }) => {
  return (
    <ProductManager
      products={purchaseData.products}
      onProductsChange={(products) => updatePurchaseData({ products })}
      title="Purchase Items"
      showSubtotal={true}
    />
  );
};
```

## Read-Only Product Display

```typescript
const ProductCatalog = ({ products }) => {
  return (
    <ProductManager
      products={products}
      onProductsChange={() => {}} // No-op since read-only
      title="Product Catalog"
      showSubtotal={false}
      readOnly={true}
    />
  );
};
```

## Custom Columns Example

```typescript
const CustomProductManager = ({ products, onProductsChange }) => {
  const customColumns = [
    { 
      key: 'name', 
      label: 'Product Name',
      render: (value, product) => (
        <div className="flex items-center">
          <img src={product.image} className="w-8 h-8 mr-2" />
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-sm text-gray-500">{product.sku}</p>
          </div>
        </div>
      )
    },
    { key: 'quantity', label: 'Qty' },
    { key: 'price', label: 'Unit Price' },
    { 
      key: 'total', 
      label: 'Line Total',
      render: (value) => <span className="font-bold">${value.toFixed(2)}</span>
    },
  ];

  return (
    <ProductManager
      products={products}
      onProductsChange={onProductsChange}
      title="Advanced Product Manager"
      customColumns={customColumns}
      showSubtotal={true}
    />
  );
};
```

## Props Reference

### Required Props
- `products: Product[]` - Array of products to display
- `onProductsChange: (products: Product[]) => void` - Callback when products change

### Optional Props
- `title?: string` - Component title (default: "Products & Services")
- `showSubtotal?: boolean` - Show subtotal calculation (default: true)
- `readOnly?: boolean` - Disable editing capabilities (default: false)
- `customColumns?: Column[]` - Custom column configuration
- `onProductAdd?: (product: Product) => void` - Callback when product is added
- `onProductUpdate?: (product: Product) => void` - Callback when product is updated
- `onProductDelete?: (productId: string) => void` - Callback when product is deleted

### Product Type
```typescript
type Product = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
};
```

## Features
- ✅ Add/Edit/Delete products
- ✅ Smart dropdown positioning 
- ✅ Form validation
- ✅ Automatic total calculation
- ✅ Mobile responsive
- ✅ Dark mode support
- ✅ Custom column rendering
- ✅ Read-only mode
- ✅ Event callbacks for custom logic