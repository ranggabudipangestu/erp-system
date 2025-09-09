'use client';

import { useState } from 'react';
import { SignupRequest } from '@/types/auth';

interface SignupFormProps {
  onSubmit: (data: SignupRequest) => Promise<void>;
  isLoading?: boolean;
}

const INDUSTRIES = [
  'manufacturing',
  'retail',
  'distribution',
  'wholesale',
  'services',
  'technology',
  'healthcare',
  'finance',
  'automotive',
  'food-beverage',
  'textiles',
  'construction',
  'other'
];

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Jakarta',
  'Asia/Bangkok',
  'Australia/Sydney',
];

export default function SignupForm({ onSubmit, isLoading }: SignupFormProps) {
  const [formData, setFormData] = useState<SignupRequest>({
    company_name: '',
    industry: '',
    domain: '',
    owner: {
      name: '',
      email: '',
      password: '',
    },
    locale: 'en',
    currency: 'USD',
    timezone: 'UTC',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else if (name.startsWith('owner.')) {
      const ownerField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        owner: {
          ...prev.owner,
          [ownerField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Company validation
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    // Domain validation (optional but if provided, validate format)
    if (formData.domain && !/^[a-z0-9-]+$/.test(formData.domain)) {
      newErrors.domain = 'Domain can only contain lowercase letters, numbers, and hyphens';
    }

    // Owner validation
    if (!formData.owner.name.trim()) {
      newErrors['owner.name'] = 'Full name is required';
    }

    if (!formData.owner.email.trim()) {
      newErrors['owner.email'] = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.owner.email)) {
      newErrors['owner.email'] = 'Please enter a valid email address';
    }

    if (!formData.owner.password) {
      newErrors['owner.password'] = 'Password is required';
    } else if (formData.owner.password.length < 8) {
      newErrors['owner.password'] = 'Password must be at least 8 characters long';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.owner.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // Clean up empty optional fields
      const cleanData: SignupRequest = {
        company_name: formData.company_name.trim(),
        owner: {
          name: formData.owner.name.trim(),
          email: formData.owner.email.trim().toLowerCase(),
          password: formData.owner.password,
        },
        locale: formData.locale,
        currency: formData.currency,
        timezone: formData.timezone,
      };

      if (formData.industry && formData.industry !== 'other') {
        cleanData.industry = formData.industry;
      }

      if (formData.domain?.trim()) {
        cleanData.domain = formData.domain.trim().toLowerCase();
      }

      await onSubmit(cleanData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Company Information */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
          <p className="text-sm text-gray-500 mt-1">Tell us about your business</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div className="md:col-span-2">
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              className={`form-input ${errors.company_name ? 'form-input-error' : ''}`}
              placeholder="Enter your company name"
            />
            {errors.company_name && (
              <p className="mt-2 text-sm text-red-600">{errors.company_name}</p>
            )}
          </div>

          {/* Industry */}
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map(industry => (
                <option key={industry} value={industry}>
                  {industry.charAt(0).toUpperCase() + industry.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Domain */}
          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
              Subdomain (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.domain ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your-company"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm text-gray-500">
                .erp.com
              </div>
            </div>
            {errors.domain && (
              <p className="mt-2 text-sm text-red-600">{errors.domain}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Create a custom URL for your team (e.g., your-company.erp.com)
            </p>
          </div>
        </div>
      </div>

      {/* Owner Information */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900">Account Owner</h3>
          <p className="text-sm text-gray-500 mt-1">Create your admin account</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label htmlFor="owner.name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="owner.name"
              name="owner.name"
              value={formData.owner.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors['owner.name'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
            {errors['owner.name'] && (
              <p className="mt-2 text-sm text-red-600">{errors['owner.name']}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="owner.email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="owner.email"
              name="owner.email"
              value={formData.owner.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors['owner.email'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email address"
            />
            {errors['owner.email'] && (
              <p className="mt-2 text-sm text-red-600">{errors['owner.email']}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="owner.password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="owner.password"
                name="owner.password"
                value={formData.owner.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors['owner.password'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors['owner.password'] && (
              <p className="mt-2 text-sm text-red-600">{errors['owner.password']}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900">Regional Settings</h3>
          <p className="text-sm text-gray-500 mt-1">Configure your business locale</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="form-input"
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Locale */}
          <div>
            <label htmlFor="locale" className="block text-sm font-medium text-gray-700 mb-2">
              Locale
            </label>
            <select
              id="locale"
              name="locale"
              value={formData.locale}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="en">English</option>
              <option value="id">Indonesian</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="es">Spanish</option>
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              id="timezone"
              name="timezone"
              value={formData.timezone}
              onChange={handleInputChange}
              className="form-input"
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>
                  {tz.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Your Account...
            </>
          ) : (
            <>
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Create My ERP Account
            </>
          )}
        </button>
        
        <p className="mt-4 text-center text-sm text-gray-500">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
        </p>
      </div>
    </form>
  );
}