import React, { useEffect, useId, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  Eye,
  EyeOff,
  UploadCloud,
  FileText,
  ChevronDown,
  ArrowRight
} from 'lucide-react';

// ============================================================================
// 1. REUSABLE BADGE COMPONENT (Semantic Accents & Role Indigo, Sentence Case)
// ============================================================================
export interface BadgeProps {
  variant?: 'verified' | 'pending' | 'danger' | 'role' | 'default' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' | 'blue';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  icon,
  className = '',
  size = 'md',
  title
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'verified':
      case 'emerald':
        return 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]';
      case 'pending':
      case 'amber':
        return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
      case 'danger':
      case 'rose':
        return 'bg-[#FEE2E2] text-[#991B1B] border-[#FECDD3]';
      case 'blue':
      case 'role':
      case 'indigo':
        return 'bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE]';
      case 'slate':
      case 'default':
      default:
        return 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]';
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border font-sans font-medium transition-colors ${getStyles()} ${sizeClass} ${className}`}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};

// ============================================================================
// 2. REUSABLE BUTTON COMPONENT (Primary / Secondary / Ghost / Destructive)
// ============================================================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'danger' | 'indigo';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  isLoading = false,
  loading = false,
  ...props
}) => {
  const isBusy = isLoading || loading;
  const isDisabled = disabled || isBusy;

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-white border border-[#E5E7EB] text-[#0A0A0A] hover:bg-[#F3F4F6] focus-visible:outline-[#0A0A0A]';
      case 'ghost':
        return 'bg-transparent text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] border-transparent focus-visible:outline-[#0A0A0A]';
      case 'destructive':
      case 'danger':
        return 'bg-[#991B1B] text-white hover:bg-[#7F1D1D] border-transparent focus-visible:outline-[#991B1B]';
      case 'indigo':
      case 'primary':
      default:
        return 'bg-[#0A0A0A] text-white hover:bg-[#262626] border-transparent focus-visible:outline-[#0A0A0A]';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 min-h-[36px] sm:min-h-[32px] text-xs rounded-lg';
      case 'lg':
        return 'px-6 py-3 min-h-[48px] sm:min-h-[44px] text-sm rounded-lg';
      case 'md':
      default:
        return 'px-4 py-2 min-h-[44px] sm:min-h-[38px] text-xs sm:text-sm rounded-lg';
    }
  };

  return (
    <motion.button
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { scale: 1.02 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`inline-flex items-center justify-center gap-2 font-sans font-semibold cursor-pointer select-none disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...(props as any)}
    >
      {isBusy ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon
      )}
      <span>{children}</span>
    </motion.button>
  );
};

// ============================================================================
// 3. REUSABLE ICON BUTTON COMPONENT (Strict 44x44px Touch Target on Mobile)
// ============================================================================
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: 'secondary' | 'ghost' | 'primary';
  size?: 'sm' | 'md';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#0A0A0A] text-white hover:bg-[#262626] border-transparent';
      case 'ghost':
        return 'bg-transparent text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] border-transparent';
      case 'secondary':
      default:
        return 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#FAFAFA]';
    }
  };

  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer touch-target-44 disabled:opacity-40 disabled:cursor-not-allowed ${getStyles()} ${sizeClass} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};

// ============================================================================
// 4. REUSABLE TEXT FIELD COMPONENT
// ============================================================================
export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  containerClassName?: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(({
  label,
  helperText,
  error,
  leadingIcon,
  trailingIcon,
  containerClassName = '',
  id,
  className = '',
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || `field-${generatedId}`;

  return (
    <div className={`space-y-1.5 w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="app-label">
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {leadingIcon && (
          <div className="absolute left-3 text-[#6B7280] pointer-events-none flex items-center justify-center">
            {leadingIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`app-input ${leadingIcon ? 'pl-10.5' : ''} ${trailingIcon ? 'pr-10' : ''} ${
            error ? 'border-[#991B1B] focus:border-[#991B1B] focus:outline-[#991B1B]' : ''
          } ${className}`}
          {...props}
        />

        {trailingIcon && (
          <div className="absolute right-3 text-[#6B7280] flex items-center justify-center">
            {trailingIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-[#991B1B] font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#6B7280] mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});

TextField.displayName = 'TextField';

// ============================================================================
// 5. REUSABLE PASSWORD FIELD COMPONENT (With Integrated 44px Show/Hide Toggle)
// ============================================================================
export interface PasswordFieldProps extends Omit<TextFieldProps, 'type'> {
  showStrength?: boolean;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  error,
  containerClassName = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      type={showPassword ? 'text' : 'password'}
      error={error}
      containerClassName={containerClassName}
      trailingIcon={
        <button
          type="button"
          onClick={() => setShowPassword(prev => !prev)}
          className="p-1 text-[#6B7280] hover:text-[#0A0A0A] transition-colors cursor-pointer touch-target-44 flex items-center justify-center"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
      {...props}
    />
  );
};

// ============================================================================
// 6. REUSABLE SELECT FIELD COMPONENT (Guaranteed Placeholder Option)
// ============================================================================
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
  containerClassName?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  placeholder,
  options,
  helperText,
  error,
  containerClassName = '',
  id,
  className = '',
  value,
  ...props
}) => {
  const generatedId = useId();
  const selectId = id || `select-${generatedId}`;

  return (
    <div className={`space-y-1.5 w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="app-label">
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <select
          id={selectId}
          value={value}
          className={`app-input pr-9 appearance-none bg-white cursor-pointer font-sans ${
            error ? 'border-[#991B1B] focus:border-[#991B1B]' : ''
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-[#6B7280]">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 pointer-events-none text-[#6B7280]">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-xs text-[#991B1B] font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#6B7280] mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

// ============================================================================
// 7. REUSABLE TEXT AREA COMPONENT
// ============================================================================
export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  maxChars?: number;
  containerClassName?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  helperText,
  error,
  maxChars,
  containerClassName = '',
  id,
  className = '',
  value,
  ...props
}) => {
  const generatedId = useId();
  const areaId = id || `textarea-${generatedId}`;
  const charCount = typeof value === 'string' ? value.length : 0;

  return (
    <div className={`space-y-1.5 w-full ${containerClassName}`}>
      <div className="flex items-center justify-between">
        {label && (
          <label htmlFor={areaId} className="app-label mb-0">
            {label}
          </label>
        )}
        {maxChars && (
          <span className="text-xs text-[#6B7280] tabular-nums">
            {charCount}/{maxChars}
          </span>
        )}
      </div>

      <textarea
        id={areaId}
        value={value}
        className={`app-input min-h-[96px] resize-y custom-scrollbar ${
          error ? 'border-[#991B1B] focus:border-[#991B1B]' : ''
        } ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-xs text-[#991B1B] font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#6B7280] mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

// ============================================================================
// 8. REUSABLE FILE DROPZONE COMPONENT (With Preview & Native Input Accessibility)
// ============================================================================
export interface FileDropzoneProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  selectedFile?: File | { name: string; size?: number | string } | null;
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  error?: string;
  helperText?: string;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  label,
  accept = '.pdf,.png,.jpg,.jpeg',
  maxSizeMB = 5,
  selectedFile,
  onFileSelect,
  onFileRemove,
  error,
  helperText,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {label && <label className="app-label">{label}</label>}

      {selectedFile ? (
        <div className="flex items-center justify-between p-3.5 bg-white border border-[#E5E7EB] rounded-lg">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-md bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center shrink-0 text-[#0A0A0A]">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0A0A0A] truncate">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-[#6B7280]">
                {typeof selectedFile.size === 'number'
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                  : selectedFile.size || 'Attached file'}
              </p>
            </div>
          </div>

          {onFileRemove && (
            <button
              type="button"
              onClick={onFileRemove}
              aria-label="Remove attached file"
              className="p-1.5 text-[#6B7280] hover:text-[#991B1B] rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-5 sm:p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-[#0A0A0A] bg-[#FAFAFA]'
              : error
              ? 'border-[#991B1B] bg-[#FEE2E2]/20'
              : 'border-[#8C8F96] hover:border-[#0A0A0A] bg-white'
          }`}
        >
          <UploadCloud className="w-8 h-8 mx-auto text-[#6B7280] mb-2" />
          <p className="text-xs font-semibold text-[#0A0A0A]">
            Click to upload or drag and drop
          </p>
          <p className="text-[11px] text-[#6B7280] mt-0.5">
            Accepted: {accept} (Max {maxSizeMB}MB)
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleNativeChange}
            className="sr-only"
            aria-hidden="true"
          />
        </div>
      )}

      {error ? (
        <p className="text-xs text-[#991B1B] font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#6B7280] mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

// ============================================================================
// 9. REUSABLE TOGGLE / SWITCH COMPONENT
// ============================================================================
export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = ''
}) => {
  return (
    <label className={`flex items-start gap-3 cursor-pointer select-none ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-[#0A0A0A] cursor-pointer ${
          checked ? 'bg-[#0A0A0A]' : 'bg-[#E5E7EB]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>

      {(label || description) && (
        <div className="text-xs">
          {label && <p className="font-semibold text-[#0A0A0A]">{label}</p>}
          {description && <p className="text-[#6B7280] mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  );
};

// ============================================================================
// 10. REUSABLE STAT CARD COMPONENT (Tabular Numeral Typography, Sentence Case)
// ============================================================================
export interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  hoverDetail?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  badge?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  hoverDetail,
  icon,
  trend,
  badge,
  className = '',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      title={hoverDetail}
      className={`app-card relative ${onClick ? 'cursor-pointer hover:border-[#9CA3AF] transition-colors' : ''} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#6B7280] truncate">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-display font-bold text-[#0A0A0A] tracking-tight tabular-nums">
          {value ?? '—'}
        </span>
        {trend && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]">
            {trend.value}
          </span>
        )}
      </div>

      {(subtext || badge) && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-[#6B7280] font-medium min-h-[20px]">
          <span className="truncate">{subtext}</span>
          {badge && <div className="shrink-0 ml-2">{badge}</div>}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 11. REUSABLE EMPTY STATE COMPONENT (Two Explicit Variants)
// ============================================================================
export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  variant?: 'nothing-yet' | 'no-results';
  action?: {
    label: string;
    onClick: () => void;
  } | React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  variant = 'nothing-yet',
  action,
  actionLabel,
  onAction,
  className = ''
}) => {
  const renderAction = () => {
    if (actionLabel && onAction) {
      return (
        <Button
          variant={variant === 'no-results' ? 'secondary' : 'primary'}
          size="sm"
          onClick={onAction}
          className="mt-2"
        >
          {actionLabel}
        </Button>
      );
    }
    if (!action) return null;
    if (React.isValidElement(action)) {
      return <div className="mt-2">{action}</div>;
    }
    if (typeof action === 'object' && 'label' in action && 'onClick' in action) {
      const act = action as { label: string; onClick: () => void };
      return (
        <Button
          variant={variant === 'no-results' ? 'secondary' : 'primary'}
          size="sm"
          onClick={act.onClick}
          className="mt-2"
        >
          {act.label}
        </Button>
      );
    }
    return null;
  };

  return (
    <div className={`app-card p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-3 ${className}`}>
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-semibold text-[#0A0A0A]">
          {title}
        </h3>
        <p className="text-xs text-[#6B7280] leading-relaxed">
          {description}
        </p>
      </div>
      {renderAction()}
    </div>
  );
};

// ============================================================================
// 12. REUSABLE SEGMENTED TABS COMPONENT (Overflow-Safe Pill Indicator)
// ============================================================================
export interface SegmentedTabOption<T extends string> {
  id: T;
  label: React.ReactNode;
  count?: number;
  icon?: React.ReactNode;
  isActionable?: boolean;
}

export interface SegmentedTabsProps<T extends string> {
  options: SegmentedTabOption<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
  layoutId?: string;
}

export function SegmentedTabs<T extends string>({
  options,
  activeTab,
  onChange,
  className = '',
  layoutId
}: SegmentedTabsProps<T>) {
  const generatedId = useId();
  const effectiveLayoutId = layoutId || `segmented-tab-${generatedId}`;

  return (
    <div
      className={`inline-flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E7EB] text-xs font-medium relative overflow-x-auto max-w-full no-scrollbar snap-x snap-mandatory flex-nowrap shrink-0 ${className}`}
    >
      {options.map((opt) => {
        const isActive = activeTab === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`relative px-3.5 py-1.5 min-h-[36px] sm:min-h-[32px] rounded-lg flex items-center gap-2 text-xs z-10 transition-colors duration-150 cursor-pointer shrink-0 whitespace-nowrap snap-start ${
              isActive
                ? 'text-white font-semibold'
                : 'text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={effectiveLayoutId}
                transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                className="absolute inset-0 bg-[#0A0A0A] rounded-lg -z-10"
              />
            )}
            {opt.icon && (
              <span className={`relative z-10 transition-colors ${isActive ? 'text-white [&>*]:text-white' : 'text-[#6B7280] [&>*]:text-[#6B7280]'}`}>
                {opt.icon}
              </span>
            )}
            <span className="relative z-10">{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`relative z-10 px-1.5 py-0.5 rounded-full text-[11px] tabular-nums font-semibold flex items-center gap-1 ${
                  isActive
                    ? 'bg-[#262626] text-white'
                    : 'bg-[#E5E7EB] text-[#374151]'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// 13. REUSABLE PAGE HEADER COMPONENT
// ============================================================================
export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  eyebrow,
  actions,
  className = ''
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5 ${className}`}>
      <div className="space-y-1">
        {eyebrow && <span className="app-eyebrow block">{eyebrow}</span>}
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0A0A0A] tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-[#6B7280] font-normal leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 14. REUSABLE SHEET / MODAL COMPONENT (1px Border, Backdrop Blur)
// ============================================================================
export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  icon?: React.ReactNode;
  headerVariant?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  className = '',
  icon
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'lg': return 'max-w-2xl';
      case 'xl': return 'max-w-4xl';
      case '2xl': return 'max-w-5xl';
      case 'md':
      default: return 'max-w-xl';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`relative bg-white border border-[#E5E7EB] rounded-t-2xl sm:rounded-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5 shadow-none font-sans text-xs z-10 pb-safe ${getMaxWidthClass()} ${className}`}
          >
            {/* Mobile Bottom Sheet Handle */}
            <div className="sm:hidden flex justify-center -mt-2 mb-1">
              <div className="w-10 h-1 rounded-full bg-[#E5E7EB]" />
            </div>

            {(title || subtitle) && (
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {icon && (
                    <div className="w-8 h-8 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    {title && (
                      <h3 className="font-semibold text-sm text-[#0A0A0A] truncate">
                        {title}
                      </h3>
                    )}
                    {subtitle && (
                      <p className="text-xs text-[#6B7280] font-normal mt-0.5 truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="text-[#6B7280] hover:text-[#0A0A0A] p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Export Modal as alias to Sheet for full backwards compatibility
export const Modal = Sheet;
export type ModalProps = SheetProps;

// ============================================================================
// 15. REUSABLE TOAST NOTICE COMPONENT
// ============================================================================
export interface ToastNoticeProps {
  message: string | null;
  onClose?: () => void;
  variant?: 'success' | 'amber' | 'info' | 'danger';
  className?: string;
}

export const ToastNotice: React.FC<ToastNoticeProps> = ({
  message,
  onClose,
  variant = 'success',
  className = ''
}) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className={`p-3.5 rounded-lg font-medium flex items-center justify-between gap-3 text-xs border ${
            variant === 'amber'
              ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
              : variant === 'info'
              ? 'bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE]'
              : variant === 'danger'
              ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECDD3]'
              : 'bg-[#0A0A0A] text-white border-[#262626]'
          } ${className}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {variant === 'amber' ? (
              <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
            ) : variant === 'info' ? (
              <Info className="w-4 h-4 text-[#3730A3] shrink-0" />
            ) : variant === 'danger' ? (
              <AlertCircle className="w-4 h-4 text-[#991B1B] shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="truncate">{message}</span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="opacity-70 hover:opacity-100 transition-opacity p-0.5 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// 16. REUSABLE SKELETON LOADER COMPONENT
// ============================================================================
export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular': return 'rounded-full';
      case 'rectangular': return 'rounded-lg';
      case 'text':
      default: return 'rounded h-4';
    }
  };

  return (
    <div
      className={`animate-pulse bg-[#F3F4F6] ${getVariantStyles()} ${className}`}
    />
  );
};

// ============================================================================
// 17. REUSABLE AVATAR COMPONENT (Initials Fallback)
// ============================================================================
export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = ''
}) => {
  const getInitials = (str: string) => {
    if (!str) return 'U';
    return str
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm': return 'w-7 h-7 text-[10px]';
      case 'lg': return 'w-12 h-12 text-sm';
      case 'md':
      default: return 'w-9 h-9 text-xs';
    }
  };

  if (src && !src.includes('default') && !src.includes('placeholder')) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover border border-[#E5E7EB] shrink-0 ${getSizeStyles()} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-bold font-sans tracking-wider border border-[#E5E7EB] shrink-0 ${getSizeStyles()} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

// ============================================================================
// 18. REUSABLE STEPPER COMPONENT
// ============================================================================
export interface StepperProps {
  steps: { id: string | number; title: string }[];
  currentStep: number;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Stepper */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold tabular-nums border ${
                    isDone
                      ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                      : isCurrent
                      ? 'bg-white text-[#0A0A0A] border-[#0A0A0A] ring-2 ring-[#0A0A0A]/20'
                      : 'bg-[#FAFAFA] text-[#6B7280] border-[#E5E7EB]'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isCurrent ? 'text-[#0A0A0A] font-semibold' : 'text-[#6B7280]'
                  }`}
                >
                  {step.title}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-[1px] mx-3 ${
                    idx < currentStep ? 'bg-[#0A0A0A]' : 'bg-[#E5E7EB]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Compact Counter */}
      <div className="sm:hidden flex items-center justify-between text-xs font-medium border-b border-[#E5E7EB] pb-2">
        <span className="text-[#0A0A0A] font-semibold">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
        </span>
        <span className="text-[#6B7280] tabular-nums">
          {Math.round(((currentStep + 1) / steps.length) * 100)}%
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// 19. REUSABLE CARD WRAPPER
// ============================================================================
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`app-card ${onClick ? 'cursor-pointer hover:border-[#9CA3AF]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export const AnimatedCheckIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <CheckCircle2 className={`w-4 h-4 text-current ${className}`} style={{ width: size, height: size }} />
);
