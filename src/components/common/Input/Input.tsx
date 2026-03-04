/**
 * Reusable Input Component
 * 
 * A flexible input component with label, error handling, and various types.
 */

import React from 'react';

interface InputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
}

export const Input: React.FC<InputProps> = ({
  name,
  value,
  onChange,
  type = 'text',
  label,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  autoComplete,
  maxLength,
  minLength,
}) => {
  const inputClasses = `
    w-full px-3 py-2 border rounded-lg 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${error ? 'border-red-500' : 'border-gray-300'}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        maxLength={maxLength}
        minLength={minLength}
        className={inputClasses}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;
