import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ERP System
          </h1>
          <p className="text-xl text-gray-600">
            Enterprise Resource Planning System
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Authentication</h2>
            <p className="text-gray-600 mb-4">User management and authentication system</p>
            <div className="text-sm text-gray-500">Coming Soon</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Company Management</h2>
            <p className="text-gray-600 mb-4">Manage company information and settings</p>
            <div className="text-sm text-gray-500">Coming Soon</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Finance</h2>
            <p className="text-gray-600 mb-4">Financial management and accounting</p>
            <div className="text-sm text-gray-500">Coming Soon</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Inventory</h2>
            <p className="text-gray-600 mb-4">Stock and inventory management</p>
            <div className="text-sm text-gray-500">Coming Soon</div>
          </div>
          
          <Link href="/products" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer block">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Master Data - Products</h2>
            <p className="text-gray-600 mb-4">Manage product information and catalog</p>
            <div className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <span className="text-sm font-medium">Manage Products</span>
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Reporting</h2>
            <p className="text-gray-600 mb-4">Analytics and business intelligence</p>
            <div className="text-sm text-gray-500">Coming Soon</div>
          </div>
        </div>
      </div>
    </div>
  );
}