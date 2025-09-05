'use client';

import { useState, useEffect } from 'react';
import { Product, CreateProductRequest, UpdateProductRequest } from '@/types/product';

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    brand: '',
    unit: '',
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    minimumStock: 0,
    isActive: true,
    imageUrl: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code,
        name: product.name,
        description: product.description || '',
        category: product.category || '',
        brand: product.brand || '',
        unit: product.unit || '',
        price: product.price,
        costPrice: product.costPrice,
        stockQuantity: product.stockQuantity,
        minimumStock: product.minimumStock,
        isActive: product.isActive,
        imageUrl: product.imageUrl || '',
      });
    } else {
      // Reset form for new product
      setFormData({
        code: '',
        name: '',
        description: '',
        category: '',
        brand: '',
        unit: '',
        price: 0,
        costPrice: 0,
        stockQuantity: 0,
        minimumStock: 0,
        isActive: true,
        imageUrl: '',
      });
    }
    setErrors({});
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' 
        ? parseFloat(value) || 0 
        : type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked
          : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) newErrors.code = 'Product code is required';
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (formData.price < 0) newErrors.price = 'Price cannot be negative';
    if (formData.costPrice < 0) newErrors.costPrice = 'Cost price cannot be negative';
    if (formData.stockQuantity < 0) newErrors.stockQuantity = 'Stock quantity cannot be negative';
    if (formData.minimumStock < 0) newErrors.minimumStock = 'Minimum stock cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (product) {
        // Update existing product
        const updateData: UpdateProductRequest = {
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category || undefined,
          brand: formData.brand || undefined,
          unit: formData.unit || undefined,
          price: formData.price,
          costPrice: formData.costPrice,
          stockQuantity: formData.stockQuantity,
          minimumStock: formData.minimumStock,
          isActive: formData.isActive,
          imageUrl: formData.imageUrl || undefined,
          updatedBy: 'admin', // TODO: Replace with actual user
        };
        await onSubmit(updateData);
      } else {
        // Create new product
        const createData: CreateProductRequest = {
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category || undefined,
          brand: formData.brand || undefined,
          unit: formData.unit || undefined,
          price: formData.price,
          costPrice: formData.costPrice,
          stockQuantity: formData.stockQuantity,
          minimumStock: formData.minimumStock,
          isActive: formData.isActive,
          imageUrl: formData.imageUrl || undefined,
          createdBy: 'admin', // TODO: Replace with actual user
        };
        await onSubmit(createData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Code */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Product Code *
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleInputChange}
            disabled={!!product} // Disable editing code for existing products
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.code ? 'border-red-500' : 'border-gray-300'
            } ${product ? 'bg-gray-100' : ''}`}
            placeholder="e.g., PRD001"
          />
          {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
        </div>

        {/* Product Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Product Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter product name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter category"
          />
        </div>

        {/* Brand */}
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
            Brand
          </label>
          <input
            type="text"
            id="brand"
            name="brand"
            value={formData.brand}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter brand"
          />
        </div>

        {/* Unit */}
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
            Unit
          </label>
          <input
            type="text"
            id="unit"
            name="unit"
            value={formData.unit}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., pcs, kg, liter"
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.price ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
        </div>

        {/* Cost Price */}
        <div>
          <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Cost Price *
          </label>
          <input
            type="number"
            id="costPrice"
            name="costPrice"
            value={formData.costPrice}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.costPrice ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          {errors.costPrice && <p className="mt-1 text-sm text-red-600">{errors.costPrice}</p>}
        </div>

        {/* Stock Quantity */}
        <div>
          <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">
            Stock Quantity *
          </label>
          <input
            type="number"
            id="stockQuantity"
            name="stockQuantity"
            value={formData.stockQuantity}
            onChange={handleInputChange}
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.stockQuantity ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
          />
          {errors.stockQuantity && <p className="mt-1 text-sm text-red-600">{errors.stockQuantity}</p>}
        </div>

        {/* Minimum Stock */}
        <div>
          <label htmlFor="minimumStock" className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Stock *
          </label>
          <input
            type="number"
            id="minimumStock"
            name="minimumStock"
            value={formData.minimumStock}
            onChange={handleInputChange}
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.minimumStock ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
          />
          {errors.minimumStock && <p className="mt-1 text-sm text-red-600">{errors.minimumStock}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter product description"
        />
      </div>

      {/* Image URL */}
      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
          Image URL
        </label>
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onChange={handleInputChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
          Active Product
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}