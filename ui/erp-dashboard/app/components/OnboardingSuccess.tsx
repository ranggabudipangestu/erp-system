'use client';

import { SignupResponse } from '../types/auth';

interface OnboardingSuccessProps {
  signupResult: SignupResponse;
  onGetStarted: () => void;
}

export default function OnboardingSuccess({ signupResult, onGetStarted }: OnboardingSuccessProps) {
  return (
    <div className="max-w-4xl mx-auto text-center">
      {/* Success Icon */}
      <div className="mx-auto flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-8">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Success Message */}
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to Your ERP System!
      </h2>
      
      <p className="text-lg text-gray-600 mb-12">
        Your account has been successfully created. You're ready to start managing your business operations.
      </p>

      {/* Next Steps */}
      <div className="bg-blue-50 rounded-xl p-8 mb-8 text-left">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Next Steps</h3>
        <ul className="space-y-4">
          {signupResult.next_steps.map((step, index) => (
            <li key={index} className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                <span className="text-sm font-medium text-blue-600">{index + 1}</span>
              </div>
              <span className="text-gray-700 text-base leading-relaxed">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Account Details */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="text-sm text-gray-600">
            <strong className="text-gray-900">Tenant ID:</strong><br />
            <span className="font-mono text-xs break-all">{signupResult.tenant_id}</span>
          </div>
          <div className="text-sm text-gray-600">
            <strong className="text-gray-900">Plan:</strong><br />
            Basic (Free Trial)
          </div>
          <div className="text-sm text-gray-600">
            <strong className="text-gray-900">Status:</strong><br />
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <button
          onClick={onGetStarted}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          🚀 Get Started with Your Dashboard
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/help"
            className="bg-white text-gray-700 py-3 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors text-center block"
          >
            📚 Getting Started Guide
          </a>
          
          <a
            href="/support"
            className="bg-white text-gray-700 py-3 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors text-center block"
          >
            💬 Contact Support
          </a>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Analytics & Reporting</h4>
          <p className="text-sm text-gray-600">
            Get insights into your business performance with comprehensive reports.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Inventory Management</h4>
          <p className="text-sm text-gray-600">
            Track stock levels, manage suppliers, and optimize your inventory.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Team Collaboration</h4>
          <p className="text-sm text-gray-600">
            Invite team members and manage roles and permissions seamlessly.
          </p>
        </div>
      </div>
    </div>
  );
}