'use client';

import React from 'react';
import { Plus, Edit, Trash2, Download, Eye } from 'lucide-react';
import { PermissionGate, usePermissions } from '@/hooks/usePermissions';
import ProtectedPermissionRoute from '@/components/auth/ProtectedPermissionRoute';

/**
 * Example component showing how to use the permission system
 * This demonstrates various permission patterns and best practices
 */
const PermissionExamplePage: React.FC = () => {
  const { canView, canCreate, canEdit, canDelete, canExport } = usePermissions();

  // Example data
  const products = [
    { id: '1', name: 'Product A', price: 100, stock: 50 },
    { id: '2', name: 'Product B', price: 200, stock: 30 },
    { id: '3', name: 'Product C', price: 150, stock: 75 },
  ];

  const handleCreate = () => {
    console.log('Creating new item...');
  };

  const handleEdit = (id: string) => {
    console.log('Editing item:', id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      console.log('Deleting item:', id);
    }
  };

  const handleExport = () => {
    console.log('Exporting data...');
  };

  return (
    <ProtectedPermissionRoute 
      permission="products.view" 
      action="can_view"
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Access Required</h3>
            <p className="text-gray-600">You need permission to view products.</p>
          </div>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* Header with Permission-based Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Manage your product catalog</p>
          </div>
          
          <div className="flex space-x-2">
            {/* Export Button - Only show if user has export permission */}
            <PermissionGate permission="products.view" action="can_export">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </PermissionGate>
            
            {/* Create Button - Only show if user has create permission */}
            <PermissionGate permission="products.view" action="can_create">
              <button
                onClick={handleCreate}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Permission Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className={`p-4 rounded-lg border ${canView('products.view') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center">
              <Eye className={`h-5 w-5 mr-2 ${canView('products.view') ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${canView('products.view') ? 'text-green-800' : 'text-red-800'}`}>
                View: {canView('products.view') ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${canCreate('products.view') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center">
              <Plus className={`h-5 w-5 mr-2 ${canCreate('products.view') ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${canCreate('products.view') ? 'text-green-800' : 'text-red-800'}`}>
                Create: {canCreate('products.view') ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${canEdit('products.view') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center">
              <Edit className={`h-5 w-5 mr-2 ${canEdit('products.view') ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${canEdit('products.view') ? 'text-green-800' : 'text-red-800'}`}>
                Edit: {canEdit('products.view') ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${canDelete('products.view') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center">
              <Trash2 className={`h-5 w-5 mr-2 ${canDelete('products.view') ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${canDelete('products.view') ? 'text-green-800' : 'text-red-800'}`}>
                Delete: {canDelete('products.view') ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${canExport('products.view') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center">
              <Download className={`h-5 w-5 mr-2 ${canExport('products.view') ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${canExport('products.view') ? 'text-green-800' : 'text-red-800'}`}>
                Export: {canExport('products.view') ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Data Table with Permission-based Actions */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                {/* Actions column - only show if user has edit or delete permissions */}
                <PermissionGate 
                  permission="products.view" 
                  action="can_edit"
                  fallback={
                    canDelete('products.view') ? (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    ) : null
                  }
                >
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </PermissionGate>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.stock}
                  </td>
                  
                  {/* Action buttons - conditionally rendered based on permissions */}
                  <PermissionGate 
                    permission="products.view" 
                    action="can_edit"
                    fallback={
                      canDelete('products.view') ? (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      ) : <td></td>
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(product.id)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                          title="Edit product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        {canDelete('products.view') && (
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </PermissionGate>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Conditional Content Block */}
        <PermissionGate 
          permission="products.view" 
          action="can_create"
          fallback={
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Limited Access</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    You have read-only access to products. Contact your administrator to request creation permissions.
                  </p>
                </div>
              </div>
            </div>
          }
        >
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Full Access</h3>
                <p className="text-sm text-green-700 mt-1">
                  You have full access to create, edit, and manage products.
                </p>
              </div>
            </div>
          </div>
        </PermissionGate>
      </div>
    </ProtectedPermissionRoute>
  );
};

export default PermissionExamplePage;