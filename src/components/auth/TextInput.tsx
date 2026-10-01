import React, { forwardRef } from 'react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  isInvalid?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(({
  className = '',
  leftIcon,
  rightElement,
  isInvalid = false,
  disabled,
  ...props
}, ref) => {
  return (
    <div className="relative w-full flex items-center">
      {leftIcon && (
        <div className="absolute left-3.5 flex items-center pointer-events-none text-[#6B7280]">
          {leftIcon}
        </div>
      )}

      <input
        ref={ref}
        disabled={disabled}
        className={`w-full h-12 rounded-lg bg-[#FFFFFF] text-[16px] sm:text-sm text-[#0A0A0A] placeholder:text-[#6B7280] font-sans transition-colors duration-150
          border ${
            isInvalid
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]'
              : 'border-[#6B7280] focus:border-[#0A0A0A] focus:ring-[#0A0A0A]'
          }
          ${leftIcon ? 'pl-11' : 'pl-3.5'}
          ${rightElement ? 'pr-11' : 'pr-3.5'}
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:bg-[#FAFAFA] disabled:text-[#6B7280] disabled:cursor-not-allowed
          ${className}
        `}
        aria-invalid={isInvalid}
        {...props}
      />

      {rightElement && (
        <div className="absolute right-3.5 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  );
});

TextInput.displayName = 'TextInput';
