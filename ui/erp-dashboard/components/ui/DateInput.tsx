'use client';

import React from 'react';

interface DateInputProps {
  value?: string;
  onChange: (date: string) => void;
  className?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

const DateInput: React.FC<DateInputProps> = ({
  value = '',
  onChange,
  className = '',
  disabled = false,
  minDate,
  maxDate,
  label,
  required = false,
  placeholder,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div>
      {label && (
        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type="date"
        value={value}
        onChange={handleInputChange}
        min={minDate}
        max={maxDate}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${className}`}
      />
    </div>
  );
};

export default DateInput;