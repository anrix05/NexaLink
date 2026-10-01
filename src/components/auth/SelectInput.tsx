import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  isInvalid?: boolean;
  leftIcon?: React.ReactNode;
  placeholder?: string;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(({
  className = '',
  options,
  isInvalid = false,
  leftIcon,
  disabled,
  placeholder,
  children,
  ...props
}, ref) => {
  return (
    <div className="relative w-full flex items-center">
      {leftIcon && (
        <div className="absolute left-3.5 flex items-center pointer-events-none text-[#6B7280]">
          {leftIcon}
        </div>
      )}

      <select
        ref={ref}
        disabled={disabled}
        className={`w-full h-12 rounded-lg bg-[#FFFFFF] text-[16px] sm:text-sm text-[#0A0A0A] font-sans transition-colors duration-150 appearance-none cursor-pointer
          border ${
            isInvalid
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]'
              : 'border-[#6B7280] focus:border-[#0A0A0A] focus:ring-[#0A0A0A]'
          }
          ${leftIcon ? 'pl-11' : 'pl-3.5'}
          pr-10
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:bg-[#FAFAFA] disabled:text-[#6B7280] disabled:cursor-not-allowed
          ${className}
        `}
        aria-invalid={isInvalid}
        {...props}
      >
        {placeholder && (
          <option value="" disabled className="text-[#6B7280]">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled} className="text-[#0A0A0A] bg-[#FFFFFF]">
            {opt.label}
          </option>
        ))}
        {children}
      </select>

      <div className="absolute right-3.5 pointer-events-none text-[#6B7280]">
        <ChevronDown className="w-4 h-4" aria-hidden="true" />
      </div>
    </div>
  );
});

SelectInput.displayName = 'SelectInput';
