'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SimpleSignupForm from '../components/SimpleSignupForm';
import OnboardingSuccess from '../components/OnboardingSuccess';
import { authApi } from '../lib/authApi';
import { SignupRequest, SignupResponse } from '../types/auth';

type SignupState = 'form' | 'success' | 'error';

export default function SignupPage() {
  const router = useRouter();
  const [state, setState] = useState<SignupState>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [signupResult, setSignupResult] = useState<SignupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (data: SignupRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authApi.signup(data);
      setSignupResult(result);
      setState('success');
      
      // Optional: Store tenant info in localStorage for future use
      if (typeof window !== 'undefined') {
        localStorage.setItem('erp_tenant_id', result.tenant_id);
        localStorage.setItem('erp_signup_completed', 'true');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.status === 400) {
        // Parse backend validation errors
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch {
          errorMessage = error.message || 'Invalid input. Please check your information.';
        }
      } else if (error.status === 409) {
        errorMessage = 'An account with this email or domain already exists.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      setError(errorMessage);
      setState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStarted = () => {
    // Redirect to dashboard or onboarding wizard
    router.push('/dashboard');
  };

  const handleRetry = () => {
    setState('form');
    setError(null);
  };

  if (state === 'form') {
    return <SimpleSignupForm onSubmit={handleSignup} isLoading={isLoading} />;
  }

  if (state === 'success' && signupResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-12">
            <OnboardingSuccess 
              signupResult={signupResult}
              onGetStarted={handleGetStarted}
            />
          </div>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Signup Failed
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
                href="/"
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors block text-center"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}