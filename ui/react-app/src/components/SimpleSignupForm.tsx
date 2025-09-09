'use client';

import { useState } from 'react';
import { SignupRequest } from '@/types/auth';

interface SimpleSignupFormProps {
  onSubmit: (data: SignupRequest) => Promise<void>;
  isLoading?: boolean;
}

export default function SimpleSignupForm({ onSubmit, isLoading }: SimpleSignupFormProps) {
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

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

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

      if (formData.industry && formData.industry !== '') {
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

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const inputFocusStyle = {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  };

  const inputErrorStyle = {
    borderColor: '#ef4444',
  };

  const buttonStyle = {
    width: '100%',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #f3e8ff 100%)',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const cardStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    padding: '40px 32px',
    textAlign: 'center' as const,
    color: 'white',
  };

  const formStyle = {
    padding: '32px',
  };

  const sectionStyle = {
    marginBottom: '32px',
  };

  const sectionTitleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
  };

  const errorStyle = {
    color: '#ef4444',
    fontSize: '14px',
    marginTop: '4px',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, marginBottom: '8px' }}>
            Start Your ERP Journey
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>
            Join thousands of businesses managing their operations efficiently
          </p>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          {/* Company Information */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Company Information</h3>
            
            <div style={gridStyle}>
              <div>
                <label htmlFor="company_name" style={labelStyle}>
                  Company Name *
                </label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle,
                    ...(errors.company_name ? inputErrorStyle : {}),
                  }}
                  onFocus={(e) => {
                    if (!errors.company_name) {
                      Object.assign(e.target.style, inputFocusStyle);
                    }
                  }}
                  onBlur={(e) => {
                    Object.assign(e.target.style, inputStyle);
                    if (errors.company_name) {
                      Object.assign(e.target.style, inputErrorStyle);
                    }
                  }}
                  placeholder="Enter your company name"
                />
                {errors.company_name && (
                  <div style={errorStyle}>{errors.company_name}</div>
                )}
              </div>

              <div>
                <label htmlFor="industry" style={labelStyle}>
                  Industry
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  style={inputStyle}
                >
                  <option value="">Select industry</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail</option>
                  <option value="distribution">Distribution</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="services">Services</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="domain" style={labelStyle}>
                  Custom Domain (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    id="domain"
                    name="domain"
                    value={formData.domain}
                    onChange={handleInputChange}
                    style={{
                      ...inputStyle,
                      paddingRight: '100px',
                      ...(errors.domain ? inputErrorStyle : {}),
                    }}
                    placeholder="your-company"
                  />
                  <div style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280',
                    fontSize: '14px',
                  }}>
                    .erp.com
                  </div>
                </div>
                {errors.domain && (
                  <div style={errorStyle}>{errors.domain}</div>
                )}
              </div>
            </div>
          </div>

          {/* Owner Account */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Account Owner</h3>
            
            <div style={gridStyle}>
              <div>
                <label htmlFor="owner.name" style={labelStyle}>
                  Full Name *
                </label>
                <input
                  type="text"
                  id="owner.name"
                  name="owner.name"
                  value={formData.owner.name}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle,
                    ...(errors['owner.name'] ? inputErrorStyle : {}),
                  }}
                  placeholder="Enter your full name"
                />
                {errors['owner.name'] && (
                  <div style={errorStyle}>{errors['owner.name']}</div>
                )}
              </div>

              <div>
                <label htmlFor="owner.email" style={labelStyle}>
                  Email Address *
                </label>
                <input
                  type="email"
                  id="owner.email"
                  name="owner.email"
                  value={formData.owner.email}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle,
                    ...(errors['owner.email'] ? inputErrorStyle : {}),
                  }}
                  placeholder="Enter your email"
                />
                {errors['owner.email'] && (
                  <div style={errorStyle}>{errors['owner.email']}</div>
                )}
              </div>

              <div>
                <label htmlFor="owner.password" style={labelStyle}>
                  Password *
                </label>
                <input
                  type="password"
                  id="owner.password"
                  name="owner.password"
                  value={formData.owner.password}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle,
                    ...(errors['owner.password'] ? inputErrorStyle : {}),
                  }}
                  placeholder="Create a password"
                />
                {errors['owner.password'] && (
                  <div style={errorStyle}>{errors['owner.password']}</div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" style={labelStyle}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle,
                    ...(errors.confirmPassword ? inputErrorStyle : {}),
                  }}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <div style={errorStyle}>{errors.confirmPassword}</div>
                )}
              </div>
            </div>
          </div>

          {/* Regional Settings */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Regional Settings</h3>
            
            <div style={gridStyle}>
              <div>
                <label htmlFor="currency" style={labelStyle}>
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  style={inputStyle}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="IDR">IDR - Indonesian Rupiah</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                  <option value="MYR">MYR - Malaysian Ringgit</option>
                </select>
              </div>

              <div>
                <label htmlFor="locale" style={labelStyle}>
                  Language
                </label>
                <select
                  id="locale"
                  name="locale"
                  value={formData.locale}
                  onChange={handleInputChange}
                  style={inputStyle}
                >
                  <option value="en">English</option>
                  <option value="id">Indonesian</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="es">Spanish</option>
                </select>
              </div>

              <div>
                <label htmlFor="timezone" style={labelStyle}>
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  style={inputStyle}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Asia/Singapore">Asia/Singapore</option>
                  <option value="Asia/Jakarta">Asia/Jakarta</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...buttonStyle,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                (e.target as HTMLElement).style.background = 'linear-gradient(135deg, #2563eb, #4f46e5)';
                (e.target as HTMLElement).style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                (e.target as HTMLElement).style.background = 'linear-gradient(135deg, #3b82f6, #6366f1)';
                (e.target as HTMLElement).style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? (
              <>
                <svg 
                  style={{ 
                    animation: 'spin 1s linear infinite',
                    width: '20px',
                    height: '20px'
                  }} 
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    opacity="0.25"
                  />
                  <path 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
                    opacity="0.75"
                  />
                </svg>
                Creating Your Account...
              </>
            ) : (
              <>
                ⚡ Create My ERP Account
              </>
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              By creating an account, you agree to our{' '}
              <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>Privacy Policy</a>
            </p>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}