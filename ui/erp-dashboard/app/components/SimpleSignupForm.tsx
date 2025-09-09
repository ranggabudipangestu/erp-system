'use client';

import { useState } from 'react';
import { SignupRequest } from '../types/auth';

interface SimpleSignupFormProps {
  onSubmit: (data: SignupRequest) => Promise<void>;
  isLoading: boolean;
}

interface FormData {
  company_name: string;
  industry: string;
  domain: string;
  owner_name: string;
  owner_email: string;
  owner_password: string;
  confirm_password: string;
  locale: string;
  currency: string;
  timezone: string;
}

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'Finance',
  'Education',
  'Consulting',
  'Real Estate',
  'Food & Beverage',
  'Transportation',
  'Other'
];

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'IDR', name: 'Indonesian Rupiah' }
];

const LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'id', name: 'Indonesian' }
];

export default function SimpleSignupForm({ onSubmit, isLoading }: SimpleSignupFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    industry: '',
    domain: '',
    owner_name: '',
    owner_email: '',
    owner_password: '',
    confirm_password: '',
    locale: 'en',
    currency: 'USD',
    timezone: 'UTC'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.company_name.trim()) {
        newErrors.company_name = 'Company name is required';
      }
      if (formData.domain && !/^[a-z0-9-]+$/.test(formData.domain)) {
        newErrors.domain = 'Domain must contain only lowercase letters, numbers, and hyphens';
      }
    }

    if (step === 2) {
      if (!formData.owner_name.trim()) {
        newErrors.owner_name = 'Name is required';
      }
      if (!formData.owner_email.trim()) {
        newErrors.owner_email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.owner_email)) {
        newErrors.owner_email = 'Please enter a valid email address';
      }
      if (!formData.owner_password) {
        newErrors.owner_password = 'Password is required';
      } else if (formData.owner_password.length < 8) {
        newErrors.owner_password = 'Password must be at least 8 characters';
      }
      if (formData.owner_password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Next button clicked, current step:', currentStep);
    if (validateStep(currentStep)) {
      console.log('Validation passed, moving to step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      console.log('Validation failed');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submit triggered, current step:', currentStep);
    
    // Only submit if we're on the last step
    if (currentStep !== 3) {
      console.log('Not on final step, preventing submission');
      return;
    }
    
    console.log('On final step, proceeding with validation');
    if (!validateStep(currentStep)) {
      console.log('Validation failed on final step');
      return;
    }
    
    console.log('Validation passed, submitting form');

    const signupData: SignupRequest = {
      company_name: formData.company_name,
      industry: formData.industry || undefined,
      domain: formData.domain || undefined,
      owner: {
        name: formData.owner_name,
        email: formData.owner_email,
        password: formData.owner_password
      },
      locale: formData.locale,
      currency: formData.currency,
      timezone: formData.timezone
    };

    await onSubmit(signupData);
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Your ERP Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Step {currentStep} of 3
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-md p-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
                
                <div>
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                    Company Name *
                  </label>
                  <input
                    id="company_name"
                    name="company_name"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Your Company Name"
                    value={formData.company_name}
                    onChange={(e) => updateFormData('company_name', e.target.value)}
                  />
                  {errors.company_name && <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>}
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                    Industry
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.industry}
                    onChange={(e) => updateFormData('industry', e.target.value)}
                  >
                    <option value="">Select your industry</option>
                    {INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                    Company Domain (Optional)
                  </label>
                  <input
                    id="domain"
                    name="domain"
                    type="text"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="your-company-domain"
                    value={formData.domain}
                    onChange={(e) => updateFormData('domain', e.target.value.toLowerCase())}
                  />
                  {errors.domain && <p className="mt-1 text-sm text-red-600">{errors.domain}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    Used for custom subdomain (lowercase letters, numbers, and hyphens only)
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Owner Account</h3>
                
                <div>
                  <label htmlFor="owner_name" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    id="owner_name"
                    name="owner_name"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Your full name"
                    value={formData.owner_name}
                    onChange={(e) => updateFormData('owner_name', e.target.value)}
                  />
                  {errors.owner_name && <p className="mt-1 text-sm text-red-600">{errors.owner_name}</p>}
                </div>

                <div>
                  <label htmlFor="owner_email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    id="owner_email"
                    name="owner_email"
                    type="email"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="your@email.com"
                    value={formData.owner_email}
                    onChange={(e) => updateFormData('owner_email', e.target.value)}
                  />
                  {errors.owner_email && <p className="mt-1 text-sm text-red-600">{errors.owner_email}</p>}
                </div>

                <div>
                  <label htmlFor="owner_password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <input
                    id="owner_password"
                    name="owner_password"
                    type="password"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Minimum 8 characters"
                    value={formData.owner_password}
                    onChange={(e) => updateFormData('owner_password', e.target.value)}
                  />
                  {errors.owner_password && <p className="mt-1 text-sm text-red-600">{errors.owner_password}</p>}
                </div>

                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                    Confirm Password *
                  </label>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm your password"
                    value={formData.confirm_password}
                    onChange={(e) => updateFormData('confirm_password', e.target.value)}
                  />
                  {errors.confirm_password && <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Regional Settings</h3>
                
                <div>
                  <label htmlFor="locale" className="block text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <select
                    id="locale"
                    name="locale"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.locale}
                    onChange={(e) => updateFormData('locale', e.target.value)}
                  >
                    {LOCALES.map((locale) => (
                      <option key={locale.code} value={locale.code}>{locale.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.currency}
                    onChange={(e) => updateFormData('currency', e.target.value)}
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.timezone}
                    onChange={(e) => updateFormData('timezone', e.target.value)}
                  >
                    <option value="UTC">UTC - Coordinated Universal Time</option>
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Europe/Berlin">Berlin</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Asia/Shanghai">Shanghai</option>
                    <option value="Asia/Jakarta">Jakarta</option>
                    <option value="Australia/Sydney">Sydney</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="group relative w-1/3 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                Previous
              </button>
            )}
            
            <div className="flex-1" />
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="group relative w-1/3 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="group relative w-1/3 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}