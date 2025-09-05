'use client';

import { useState } from 'react';
import { Product, CreateProductRequest, UpdateProductRequest } from '@/types/product';
import { productApi } from '@/lib/productApi';
import { ApiError } from '@/lib/api';
import ProductList from '@/components/ProductList';
import ProductForm from '@/components/ProductForm';

type ViewMode = 'list' | 'create' | 'edit';

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showNotification = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message);
      setError(null);
    } else {
      setError(message);
      setSuccess(null);
    }
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setViewMode('create');
    setError(null);
    setSuccess(null);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setViewMode('edit');
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setIsLoading(true);
      await productApi.delete(id);
      showNotification('Product deleted successfully', 'success');
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete product';
      showNotification(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (data: CreateProductRequest | UpdateProductRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      if (viewMode === 'create') {
        await productApi.create(data as CreateProductRequest);
        showNotification('Product created successfully', 'success');
      } else if (viewMode === 'edit' && selectedProduct) {
        await productApi.update(selectedProduct.id, data as UpdateProductRequest);
        showNotification('Product updated successfully', 'success');
      }

      setViewMode('list');
      setSelectedProduct(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save product';
      showNotification(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedProduct(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {viewMode === 'list' ? 'Products' : viewMode === 'create' ? 'Create Product' : 'Edit Product'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {viewMode === 'list' 
                  ? 'Manage your product inventory' 
                  : viewMode === 'create' 
                    ? 'Add a new product to your inventory'
                    : 'Update product information'
                }
              </p>
            </div>
            {viewMode === 'list' && (
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Product
              </button>
            )}
          </div>

          {/* Notifications */}
          {(error || success) && (
            <div className="px-6 py-3 border-b border-gray-200">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-800">{success}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {viewMode === 'list' && (
              <ProductList
                onEdit={handleEdit}
                onDelete={handleDelete}
                refreshTrigger={refreshTrigger}
              />
            )}

            {(viewMode === 'create' || viewMode === 'edit') && (
              <ProductForm
                product={selectedProduct}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}