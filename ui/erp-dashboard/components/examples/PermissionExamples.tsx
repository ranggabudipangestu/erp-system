'use client';

import React from 'react';
import { Plus, Edit, Trash2, Download, Eye } from 'lucide-react';
import { PermissionGate, usePermissions } from '@/hooks/usePermissions';

/**
 * Example component showing how to use the permission system
 */
const PermissionExamples: React.FC = () => {
  const { canView, canCreate, canEdit, canDelete, canExport } = usePermissions();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Permission System Examples</h2>
        <p className="text-gray-600 mb-6">
          This page demonstrates how to use the permission system to control UI elements based on user permissions.
        </p>
      </div>

      {/* Example 1: Product Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Example 1: Product Management</h3>
        
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-md font-medium">Products</h4>
          
          <div className="flex space-x-2">
            <PermissionGate permission="products.view" action="can_export">
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </PermissionGate>
            
            <PermissionGate permission="products.view" action="can_create">
              <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <PermissionGate permission="products.view" action="can_edit">
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </PermissionGate>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Sample Product 1</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">SKU001</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$99.99</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">50</td>
                <PermissionGate permission="products.view" action="can_edit">
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {canView('products.view') && (
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      
                      {canEdit('products.view') && (
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      
                      {canDelete('products.view') && (
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </PermissionGate>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Sample Product 2</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">SKU002</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$149.99</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">25</td>
                <PermissionGate permission="products.view" action="can_edit">
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {canView('products.view') && (
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      
                      {canEdit('products.view') && (
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      
                      {canDelete('products.view') && (
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </PermissionGate>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Example 2: Sales Invoice */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Example 2: Sales Invoice</h3>
        
        <PermissionGate 
          permission="sales.invoices.view" 
          action="can_view"
          fallback={
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg font-medium">Access Denied</div>
              <div className="text-sm mt-1">You don't have permission to view invoices</div>
            </div>
          }
        >
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium">Invoice List</h4>
            
            <PermissionGate permission="sales.invoices.view" action="can_create">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </button>
            </PermissionGate>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">INV-001</div>
                  <div className="text-sm text-gray-500">Customer A</div>
                  <div className="text-lg font-bold text-green-600">$1,250.00</div>
                </div>
                
                <div className="flex space-x-1">
                  {canEdit('sales.invoices.view') && (
                    <button className="p-1 text-indigo-600 hover:text-indigo-900">
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete('sales.invoices.view') && (
                    <button className="p-1 text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <PermissionGate permission="sales.invoices.view" action="can_export">
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button className="text-sm text-blue-600 hover:text-blue-900">
                    Download PDF
                  </button>
                </div>
              </PermissionGate>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">INV-002</div>
                  <div className="text-sm text-gray-500">Customer B</div>
                  <div className="text-lg font-bold text-green-600">$2,100.00</div>
                </div>
                
                <div className="flex space-x-1">
                  {canEdit('sales.invoices.view') && (
                    <button className="p-1 text-indigo-600 hover:text-indigo-900">
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete('sales.invoices.view') && (
                    <button className="p-1 text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <PermissionGate permission="sales.invoices.view" action="can_export">
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button className="text-sm text-blue-600 hover:text-blue-900">
                    Download PDF
                  </button>
                </div>
              </PermissionGate>
            </div>
          </div>
        </PermissionGate>
      </div>

      {/* Example 3: Conditional Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Example 3: Conditional Navigation</h3>
        
        <div className="space-y-2">
          <PermissionGate permission="products.view">
            <div className="flex items-center space-x-3 p-3 rounded-md bg-green-50 text-green-800">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span>✓ Products - You have access</span>
            </div>
          </PermissionGate>

          <PermissionGate permission="sales.invoices.view">
            <div className="flex items-center space-x-3 p-3 rounded-md bg-green-50 text-green-800">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span>✓ Sales Invoices - You have access</span>
            </div>
          </PermissionGate>

          <PermissionGate permission="purchasing.orders.view">
            <div className="flex items-center space-x-3 p-3 rounded-md bg-green-50 text-green-800">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span>✓ Purchase Orders - You have access</span>
            </div>
          </PermissionGate>

          <PermissionGate 
            permission="finance.accounting.view"
            fallback={
              <div className="flex items-center space-x-3 p-3 rounded-md bg-red-50 text-red-800">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span>✗ Finance - Access denied</span>
              </div>
            }
          >
            <div className="flex items-center space-x-3 p-3 rounded-md bg-green-50 text-green-800">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span>✓ Finance - You have access</span>
            </div>
          </PermissionGate>
        </div>
      </div>

      {/* Example 4: Hook Usage */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Example 4: Using Permission Hooks</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Permission Check Results:</h4>
            <div className="space-y-2 text-sm">
              <div>Products View: <span className={canView('products.view') ? 'text-green-600' : 'text-red-600'}>{canView('products.view') ? '✓' : '✗'}</span></div>
              <div>Products Create: <span className={canCreate('products.view') ? 'text-green-600' : 'text-red-600'}>{canCreate('products.view') ? '✓' : '✗'}</span></div>
              <div>Products Edit: <span className={canEdit('products.view') ? 'text-green-600' : 'text-red-600'}>{canEdit('products.view') ? '✓' : '✗'}</span></div>
              <div>Products Delete: <span className={canDelete('products.view') ? 'text-green-600' : 'text-red-600'}>{canDelete('products.view') ? '✓' : '✗'}</span></div>
              <div>Products Export: <span className={canExport('products.view') ? 'text-green-600' : 'text-red-600'}>{canExport('products.view') ? '✓' : '✗'}</span></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Code Example:</h4>
            <div className="bg-gray-100 p-3 rounded text-xs font-mono">
{`const { canView, canCreate } = usePermissions();

// Use in conditions
if (canView('products.view')) {
  // Show product list
}

// Use in JSX
{canCreate('products.view') && (
  <button>Add Product</button>
)}

// Use with PermissionGate
<PermissionGate permission="products.view" action="can_edit">
  <EditButton />
</PermissionGate>`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionExamples;