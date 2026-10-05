import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, ShieldCheck, ShieldAlert, ArrowUp } from 'lucide-react';
import { TextInput } from './TextInput';

export interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  isInvalid?: boolean;
  showStrength?: boolean;
  onStrengthChange?: (strength: 'too_short' | 'okay' | 'strong') => void;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(({
  isInvalid = false,
  showStrength = false,
  onStrengthChange,
  value,
  onChange,
  onKeyDown,
  onKeyUp,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Caps lock detection
  const handleKeyActivity = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      const isCaps = e.getModifierState('CapsLock');
      setCapsLockActive(isCaps);
    }
  };

  // NIST style strength evaluation
  const valStr = typeof value === 'string' ? value : '';
  const getStrength = (val: string): 'too_short' | 'okay' | 'strong' => {
    if (!val || val.length < 10) return 'too_short';
    if (val.length >= 14 || (/[A-Z]/.test(val) && /[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val))) {
      return 'strong';
    }
    return 'okay';
  };

  const strength = getStrength(valStr);

  return (
    <div className="w-full flex flex-col gap-1.5">
      <TextInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => {
          onChange?.(e);
          if (showStrength && onStrengthChange) {
            onStrengthChange(getStrength(e.target.value));
          }
        }}
        onKeyDown={(e) => {
          handleKeyActivity(e);
          onKeyDown?.(e);
        }}
        onKeyUp={(e) => {
          handleKeyActivity(e);
          onKeyUp?.(e);
        }}
        isInvalid={isInvalid}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="w-11 h-11 flex items-center justify-center text-[#6B7280] hover:text-[#0A0A0A] rounded focus-visible:outline-2 focus-visible:outline-[#0A0A0A] transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        {...props}
      />

      {/* Caps lock warning (text + icon) */}
      {capsLockActive && (
        <div
          role="status"
          className="flex items-center gap-1.5 text-xs text-[#B45309] font-medium"
        >
          <ArrowUp className="w-3.5 h-3.5 p-0.5 rounded-full bg-[#FEF3C7] text-[#B45309]" />
          <span>Caps lock is on</span>
        </div>
      )}

      {/* NIST strength meter (icon + text, sentence case) */}
      {showStrength && valStr.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs pt-0.5 select-none" role="status">
          {strength === 'too_short' && (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />
              <span className="text-[#DC2626] font-medium">Too short (minimum 10 characters)</span>
            </>
          )}
          {strength === 'okay' && (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-[#6B7280]" />
              <span className="text-[#6B7280]">Okay</span>
            </>
          )}
          {strength === 'strong' && (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
              <span className="text-[#059669] font-medium">Strong</span>
            </>
          )}
        </div>
      )}
    </div>
  );
});

PasswordField.displayName = 'PasswordField';
