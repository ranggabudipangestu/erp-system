'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '../components/LoginForm';
import { authApi } from '../lib/authApi';
import { LoginRequest, LoginResponse } from '../types/auth';

type LoginState = 'form' | 'success' | 'error';

export default function LoginPage() {
  const router = useRouter();
  const [state, setState] = useState<LoginState>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requireTenantDomain] = useState(false); // This could be fetched from config/environment

  const handleLogin = async (data: LoginRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authApi.login(data);
      
      // Store authentication tokens and user info
      if (typeof window !== 'undefined') {
        localStorage.setItem('erp_access_token', result.access_token);
        localStorage.setItem('erp_refresh_token', result.refresh_token);
        localStorage.setItem('erp_tenant_id', result.tenant.id);
        localStorage.setItem('erp_user_id', result.user.id);
        localStorage.setItem('erp_token_expires', (Date.now() + (result.expires_in * 1000)).toString());
        localStorage.setItem('erp_user_info', JSON.stringify({
          user: result.user,
          tenant: result.tenant
        }));
      }

      setState('success');
      
      // Redirect to dashboard after successful login
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.status === 401) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.status === 429) {
        errorMessage = error.message || 'Too many login attempts. Please try again later.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setState('form');
    setError(null);
  };

  if (state === 'form') {
    return (
      <>
        <LoginForm 
          onSubmit={handleLogin} 
          isLoading={isLoading} 
          requireTenantDomain={requireTenantDomain}
        />
        
        {/* Show error message overlay */}
        {error && (
          <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-4 text-center z-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-white hover:text-red-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome back!
            </h2>
            
            <p className="text-gray-600 mb-6">
              You have successfully signed in. Redirecting to your dashboard...
            </p>

            <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Login Failed
            </h2>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Try Again
              </button>
              
              <a
                href="/signup"
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors block text-center"
              >
                Create New Account
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}