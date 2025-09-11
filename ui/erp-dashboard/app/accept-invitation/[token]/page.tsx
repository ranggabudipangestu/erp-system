'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AcceptInviteForm from '@/components/auth/AcceptInviteForm';
import Alert from '@/components/ui/alert/Alert';
import { authApi } from '@/app/lib/authApi';
import { AcceptInviteRequest, Invite } from '@/types/auth';

type AcceptInvitationState = 'loading' | 'form' | 'success' | 'error';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  
  const [state, setState] = useState<AcceptInvitationState>('loading');
  const [invitation, setInvitation] = useState<Invite | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      validateInvitation();
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      setState('loading');
      const result = await authApi.validateInvitation(token);
      setInvitation(result);
      // You might want to fetch tenant info here too if needed
      setState('form');
    } catch (error: any) {
      console.error('Invitation validation error:', error);
      
      let errorMessage = 'This invitation is no longer valid.';
      
      if (error.status === 400) {
        if (error.message.includes('expired')) {
          errorMessage = 'This invitation has expired. Please ask your admin to send you a new invitation.';
        } else if (error.message.includes('used')) {
          errorMessage = 'This invitation has already been used. If you already have an account, please log in instead.';
        } else {
          errorMessage = error.message;
        }
      } else if (error.status === 404) {
        errorMessage = 'Invalid invitation link. Please check the link and try again.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      setError(errorMessage);
      setState('error');
    }
  };

  const handleAcceptInvitation = async (data: Omit<AcceptInviteRequest, 'token'>): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const acceptData: AcceptInviteRequest = {
        ...data,
        token
      };

      const result = await authApi.acceptInvitation(token, acceptData);
      
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
        
        // Also set cookies for server-side auth (optional for future use)
        document.cookie = `erp_access_token=${result.access_token}; path=/; max-age=${result.expires_in}`;
      }

      setState('success');
      
      // Redirect to home after successful acceptance
      setTimeout(() => {
        router.replace('/');
      }, 2000);
      
    } catch (error: any) {
      console.error('Accept invitation error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.status === 400) {
        if (error.message.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Please log in instead.';
        } else if (error.message.includes('expired')) {
          errorMessage = 'This invitation has expired. Please ask your admin to send you a new invitation.';
        } else {
          errorMessage = error.message;
        }
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <div className="animate-spin mx-auto w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Validating your invitation...
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your invitation.
            </p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Invitation
            </h2>
            
            <p className="text-gray-600 mb-6">
              {error}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="w-full px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Create New Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'form' && invitation) {
    return (
      <>
        <AcceptInviteForm 
          invitation={invitation}
          companyName={companyName}
          onSubmit={handleAcceptInvitation} 
          isLoading={isLoading} 
        />
        
        {/* Toast Alert for errors */}
        {error && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
            <div className="relative">
              <Alert
                variant="error"
                title="Error"
                message={error}
                showLink={false}
              />
              <button
                onClick={() => setError(null)}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
              Welcome aboard!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Your account has been created successfully. You're now part of the team!
            </p>

            <p className="text-sm text-gray-500 mb-4">
              Redirecting you to your dashboard...
            </p>

            <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}