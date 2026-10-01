import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  variant?: 'emerald' | 'obsidian';
  id?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  variant = 'emerald',
  id,
  className = '',
}) => {
  const switchId = id || React.useId();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  const activeBg = variant === 'emerald' ? 'bg-[#065F46]' : 'bg-[#0A0A0A]';

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {label && (
        <label
          htmlFor={switchId}
          className={`text-xs select-none cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed text-[#6B7280]' : 'text-[#0A0A0A] font-medium'
          }`}
        >
          <div>{label}</div>
          {description && (
            <div className="text-[11px] text-[#6B7280] font-normal mt-0.5">{description}</div>
          )}
        </label>
      )}

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2 ${
          checked ? activeBg : 'bg-[#E5E7EB]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
