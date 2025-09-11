"use client";
import React, { useState } from "react";
import { CreateInviteRequest } from '@/types/auth';

interface InviteUserFormProps {
  onSubmit: (data: CreateInviteRequest) => Promise<void>;
  isLoading: boolean;
  onCancel?: () => void;
}

const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to tenant management and users' },
  { value: 'finance', label: 'Finance', description: 'Access to financial reports and journal entries' },
  { value: 'sales', label: 'Sales', description: 'Access to create orders and manage sales' },
  { value: 'warehouse', label: 'Warehouse', description: 'Access to inventory and stock management' },
  { value: 'production', label: 'Production', description: 'Access to manufacturing and work orders' }
];

export default function InviteUserForm({ onSubmit, isLoading, onCancel }: InviteUserFormProps) {
  const [formData, setFormData] = useState<CreateInviteRequest>({
    email: '',
    roles: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!new RegExp('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$').test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.roles.length === 0) {
      newErrors.roles = 'At least one role must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const inviteData: CreateInviteRequest = {
      email: formData.email.trim(),
      roles: formData.roles
    };

    await onSubmit(inviteData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleToggle = (roleValue: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleValue)
        ? prev.roles.filter(role => role !== roleValue)
        : [...prev.roles, roleValue]
    }));
    // Clear roles error when user selects a role
    if (errors.roles) {
      setErrors(prev => ({ ...prev, roles: '' }));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Invite New User
        </h2>
        <p className="text-gray-600">
          Send an invitation to a new team member to join your organization
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.email 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              placeholder="Enter user's email address"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.email}
            </p>
          )}
        </div>

        {/* Roles Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Assign Roles <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-4">
            Select one or more roles for this user. They can be modified later.
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            {AVAILABLE_ROLES.map((role) => (
              <div
                key={role.value}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                  formData.roles.includes(role.value)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${errors.roles ? 'border-red-300' : ''}`}
                onClick={() => handleRoleToggle(role.value)}
              >
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role.value)}
                    onChange={() => handleRoleToggle(role.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <div className="ml-3 flex-1">
                    <label className="text-sm font-medium text-gray-900 cursor-pointer">
                      {role.label}
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      {role.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {errors.roles && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.roles}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending Invitation...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Invitation
              </>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Info Section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">About Invitations</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• The user will receive an email with a link to accept the invitation</li>
              <li>• Invitations expire after 7 days</li>
              <li>• Users can only accept an invitation once</li>
              <li>• Roles can be modified after the user joins</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}