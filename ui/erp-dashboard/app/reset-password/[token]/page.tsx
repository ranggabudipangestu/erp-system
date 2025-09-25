'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import Alert from '@/components/ui/alert/Alert';
import { passwordApi } from '@/lib/api/password';
import { ResetPasswordRequest } from '@/types/auth';

type ResetPasswordState = 'loading' | 'form' | 'success' | 'error';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  
  const [state, setState] = useState<ResetPasswordState>('loading');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenMessage, setTokenMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setState('error');
        setTokenMessage('No reset token provided');
        return;
      }

      try {
        const result = await passwordApi.validateResetToken(token);
        
        if (result.valid) {
          setTokenValid(true);
          setUserEmail(result.email || '');
          setState('form');
        } else {
          setTokenValid(false);
          setTokenMessage(result.message);
          setState('error');
        }
      } catch (error: any) {
        console.error('Token validation error:', error);
        setTokenValid(false);
        setTokenMessage(error.message || 'Failed to validate reset token');
        setState('error');
      }
    };

    validateToken();
  }, [token]);

  const handleResetPassword = async (data: ResetPasswordRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await passwordApi.resetPassword(data);
      
      if (result.success) {
        setState('success');
      } else {
        setError(result.message);
        setShowToast(true);
        
        // Auto hide toast after 5 seconds
        setTimeout(() => {
          setShowToast(false);
          setError(null);
        }, 5000);
      }
      
    } catch (error: any) {
      console.error('Reset password error:', error);
      
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

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
            <p className="text-gray-600">Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  if (state === 'form') {
    return (
      <>
        <div className="relative">
          <ResetPasswordForm 
            token={token}
            onSubmit={handleResetPassword} 
            isLoading={isLoading}
            tokenValid={tokenValid}
            tokenMessage={tokenMessage}
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

  // Success state
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
              Password Updated Successfully
            </h2>
            
            <p className="text-gray-600 mb-2">
              Your password has been updated successfully.
            </p>
            
            <p className="text-sm text-gray-500 mb-8">
              For security, you have been signed out of all devices. Please sign in with your new password.
            </p>

            <div className="space-y-4">
              <button
                onClick={handleBackToLogin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
              >
                Login with new password
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                If you didn't request this password change, please contact support immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state (invalid token)
  if (state === 'error') {
    return (
      <ResetPasswordForm 
        token={token}
        onSubmit={handleResetPassword} 
        isLoading={false}
        tokenValid={false}
        tokenMessage={tokenMessage}
      />
    );
  }

  return null;
}