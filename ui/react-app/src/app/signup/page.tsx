'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SimpleSignupForm from '@/components/SimpleSignupForm';
import OnboardingSuccess from '@/components/OnboardingSuccess';
import { authApi } from '@/lib/authApi';
import { SignupRequest, SignupResponse } from '@/types/auth';

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
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #f3e8ff 100%)',
        padding: '40px 20px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '48px',
        }}>
          <OnboardingSuccess 
            signupResult={signupResult}
            onGetStarted={handleGetStarted}
          />
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #f3e8ff 100%)',
        padding: '40px 20px',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '48px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <svg style={{ width: '40px', height: '40px', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>
            Signup Failed
          </h2>
          
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '32px'
          }}>
            <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>
          </div>

          <button
            onClick={handleRetry}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            Try Again
          </button>
          
          <Link
            href="/"
            style={{
              display: 'inline-block',
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return null;
}