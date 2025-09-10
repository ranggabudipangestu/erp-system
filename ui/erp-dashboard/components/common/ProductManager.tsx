import React, { useState, useRef, useEffect } from 'react';
import { TrashBinIcon, MoreDotIcon, PencilIcon } from '@/icons/index';

export type Product = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
};

export type Column = {
  key: keyof Product;
  label: string;
  render?: (value: any, product: Product) => React.ReactNode;
};

export interface ProductManagerProps {
  products: Product[];
  onProductsChange: (products: Product[]) => void;
  title?: string;
  showSubtotal?: boolean;
  readOnly?: boolean;
  customColumns?: Column[];
  onProductAdd?: (product: Product) => void;
  onProductUpdate?: (product: Product) => void;
  onProductDelete?: (productId: string) => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  onProductsChange,
  title = "Products & Services",
  showSubtotal = true,
  readOnly = false,
  customColumns,
  onProductAdd,
  onProductUpdate,
  onProductDelete,
}) => {
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    description: '',
    quantity: 1,
    price: 0,
  });

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const productNameRef = useRef<HTMLInputElement>(null);

  const calculateProductTotal = (quantity: number, price: number) => {
    return quantity * price;
  };

  const addOrUpdateProduct = () => {
    if (!currentProduct.name) return;

    if (editingProductId) {
      // Update existing product
      const updatedProduct = {
        id: editingProductId,
        name: currentProduct.name,
        description: currentProduct.description,
        quantity: currentProduct.quantity,
        price: currentProduct.price,
        total: calculateProductTotal(currentProduct.quantity, currentProduct.price)
      };

      const updatedProducts = products.map(product =>
        product.id === editingProductId ? updatedProduct : product
      );
      
      onProductsChange(updatedProducts);
      onProductUpdate?.(updatedProduct);
      setEditingProductId(null);
    } else {
      // Add new product
      const newProduct: Product = {
        id: Date.now().toString(),
        name: currentProduct.name,
        description: currentProduct.description,
        quantity: currentProduct.quantity,
        price: currentProduct.price,
        total: calculateProductTotal(currentProduct.quantity, currentProduct.price)
      };

      const updatedProducts = [...products, newProduct];
      onProductsChange(updatedProducts);
      onProductAdd?.(newProduct);
    }

    // Reset current product form
    resetForm();
  };

  const removeProduct = (productId: string) => {
    const updatedProducts = products.filter(product => product.id !== productId);
    onProductsChange(updatedProducts);
    onProductDelete?.(productId);
    setOpenDropdownId(null);
    
    // If we're editing this product, reset the form
    if (editingProductId === productId) {
      setEditingProductId(null);
      resetForm();
    }
  };

  const editProduct = (product: Product) => {
    setCurrentProduct({
      name: product.name,
      description: product.description,
      quantity: product.quantity,
      price: product.price,
    });
    setEditingProductId(product.id);
    setOpenDropdownId(null);
    // Focus on product name input after a brief delay
    setTimeout(() => {
      if (productNameRef.current) {
        productNameRef.current.focus();
      }
    }, 100);
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    resetForm();
  };

  const resetForm = () => {
    setCurrentProduct({
      name: '',
      description: '',
      quantity: 1,
      price: 0,
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openDropdownId && !target.closest('.relative')) {
        setOpenDropdownId(null);
      }
    };

    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const subtotal = products.reduce((sum, product) => sum + product.total, 0);

  // Default columns configuration
  const defaultColumns = [
    { key: 'name' as keyof Product, label: 'Products' },
    { key: 'quantity' as keyof Product, label: 'Quantity' },
    { key: 'price' as keyof Product, label: 'Unit Cost' },
    { key: 'total' as keyof Product, label: 'Total' },
  ];

  const columns = customColumns || defaultColumns;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-black dark:text-white mb-4">
          {title}
        </h3>
        
        {/* Product Entry Form */}
        {!readOnly && (
          <div className="space-y-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/30 dark:border-gray-600 dark:bg-gray-800/30">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Product Name
                  </label>
                  <input
                    ref={productNameRef}
                    type="text"
                    placeholder="Enter product name"
                    value={currentProduct.name}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Enter description"
                    value={currentProduct.description}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={currentProduct.quantity}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter product price"
                    value={currentProduct.price}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  />
                </div>
                <div className="flex items-end space-x-2">
                  {editingProductId && (
                    <button
                      onClick={cancelEdit}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={addOrUpdateProduct}
                    disabled={!currentProduct.name}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {editingProductId ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        {products.length > 0 && (
          <div className="mb-6">
            <div className="overflow-x-auto border border-gray-200 rounded-lg dark:border-gray-600 relative">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100 text-left dark:bg-gray-700">
                    <th className="px-4 py-4 font-medium text-black dark:text-white rounded-tl-lg">
                      S. No.
                    </th>
                    {columns.map((column) => (
                      <th key={column.key} className="px-4 py-4 font-medium text-black dark:text-white">
                        {column.label}
                      </th>
                    ))}
                    {!readOnly && (
                      <th className="px-4 py-4 font-medium text-black dark:text-white rounded-tr-lg">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.id}>
                      <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                        <p className="text-black dark:text-white">
                          {index + 1}
                        </p>
                      </td>
                      {columns.map((column) => (
                        <td key={column.key} className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          {column.render ? (
                            column.render(product[column.key], product)
                          ) : column.key === 'name' ? (
                            <div>
                              <p className="font-medium text-black dark:text-white">
                                {product.name}
                              </p>
                              {product.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          ) : column.key === 'price' || column.key === 'total' ? (
                            <p className="text-black dark:text-white">
                              ${(product[column.key] as number).toFixed(2)}
                            </p>
                          ) : (
                            <p className="text-black dark:text-white">
                              {product[column.key]}
                            </p>
                          )}
                        </td>
                      ))}
                      {!readOnly && (
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === product.id ? null : product.id)}
                              className="text-gray-500 hover:text-gray-700 p-1 dark:text-gray-400 dark:hover:text-gray-200"
                              title="Actions"
                            >
                              <MoreDotIcon className="w-5 h-5" />
                            </button>
                            
                            {openDropdownId === product.id && (
                              <div className={`absolute left-[-120px] z-50 w-36 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-600 ${
                                index >= products.length - 2 ? 'bottom-8' : 'top-8'
                              }`}>
                                <div className="py-1">
                                  <button
                                    onClick={() => editProduct(product)}
                                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                  >
                                    <PencilIcon className="mr-3 h-4 w-4" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => removeProduct(product.id)}
                                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <TrashBinIcon className="mr-3 h-4 w-4" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showSubtotal && (
              <div className="border-t border-stroke pt-4 dark:border-strokedark">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-black dark:text-white">
                    Subtotal:
                  </span>
                  <span className="text-xl font-semibold text-black dark:text-white">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManager;