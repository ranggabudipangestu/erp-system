'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import Alert from '@/components/ui/alert/Alert';
import { passwordApi } from '@/lib/api/password';
import { ForgotPasswordRequest } from '@/types/auth';

type ForgotPasswordState = 'form' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<ForgotPasswordState>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleForgotPassword = async (data: ForgotPasswordRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await passwordApi.forgotPassword(data);
      
      // Store the submitted email for display
      setSubmittedEmail(data.email);
      setState('success');
      
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setShowToast(true);
      
      // Auto hide toast after 5 seconds
      setTimeout(() => {
        setShowToast(false);
        setError(null);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseToast = () => {
    setShowToast(false);
    setError(null);
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  if (state === 'form') {
    return (
      <>
        <div className="relative">
          <ForgotPasswordForm 
            onSubmit={handleForgotPassword} 
            isLoading={isLoading}
          />
          
          {/* Toast Alert for errors */}
          {showToast && error && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
              <div className="relative">
                <Alert
                  variant="error"
                  title="Error"
                  message={error}
                  showLink={false}
                />
                <button
                  onClick={handleCloseToast}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Check your email
            </h2>
            
            <p className="text-gray-600 mb-2">
              If an account with <strong>{submittedEmail}</strong> exists, you'll receive password reset instructions shortly.
            </p>
            
            <p className="text-sm text-gray-500 mb-8">
              The reset link will expire in 15 minutes for security.
            </p>

            <div className="space-y-4">
              <button
                onClick={handleBackToLogin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Back to sign in
              </button>
              
              <button
                onClick={() => setState('form')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
              >
                Try a different email
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Didn't receive an email? Check your spam folder or try again.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}