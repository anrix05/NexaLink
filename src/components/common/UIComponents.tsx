import React, { useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

// ============================================================================
// 1. REUSABLE BADGE / PILL COMPONENT (Monochromatic Editorial Standard)
// ============================================================================
export interface BadgeProps {
  variant?: 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate' | 'blue' | 'teal';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'indigo',
  children,
  icon,
  className = '',
  size = 'md',
  title
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'emerald':
        return 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]';
      case 'amber':
        return 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
      case 'rose':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'purple':
      case 'blue':
      case 'teal':
      case 'slate':
      case 'indigo':
      default:
        return 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]';
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]';

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border font-sans font-bold uppercase tracking-wider transition-colors ${getStyles()} ${sizeClass} ${className}`}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};

// ============================================================================
// 2. REUSABLE BUTTON COMPONENT (Solid Black Primary / 1px Border Secondary)
// ============================================================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'indigo';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  isLoading = false,
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-white border border-[#E5E7EB] text-[#0A0A0A] hover:bg-[#F8F8F8]';
      case 'ghost':
        return 'bg-transparent text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] border-transparent';
      case 'danger':
        return 'bg-rose-600 text-white hover:bg-rose-700';
      case 'indigo':
      case 'primary':
      default:
        return 'bg-[#0A0A0A] text-white hover:bg-[#222222]';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 min-h-[36px] sm:min-h-[32px] text-[11px] rounded-lg';
      case 'lg':
        return 'px-6 py-3 min-h-[48px] sm:min-h-[44px] text-xs rounded-lg';
      case 'md':
      default:
        return 'px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-[38px] text-xs rounded-lg';
    }
  };

  return (
    <motion.button
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { scale: 1.03 }}
      whileTap={isDisabled ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`inline-flex items-center justify-center gap-2 font-display font-bold uppercase tracking-wider cursor-pointer select-none disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...(props as any)}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon
      )}
      <span>{children}</span>
    </motion.button>
  );
};

// ============================================================================
// 3. REUSABLE SEGMENTED TAB BUTTON BAR COMPONENT (Sliding Pill Indicator)
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
      className={`inline-flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E7EB] text-xs font-display font-bold relative overflow-x-auto max-w-full no-scrollbar snap-x snap-mandatory flex-nowrap shrink-0 ${className}`}
    >
      {options.map((opt) => {
        const isActive = activeTab === opt.id;
        const hasAction = opt.isActionable && (opt.count ?? 0) > 0;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`relative px-3 sm:px-3.5 py-1.5 min-h-[36px] sm:min-h-[32px] rounded-lg flex items-center gap-1.5 sm:gap-2 uppercase tracking-wider text-[10px] sm:text-[11px] z-10 transition-colors duration-150 cursor-pointer shrink-0 whitespace-nowrap snap-start ${
              isActive
                ? 'text-white'
                : 'text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6]/60'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={effectiveLayoutId}
                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                className="absolute inset-0 bg-[#0A0A0A] rounded-lg -z-10 shadow-xs"
              />
            )}
            {opt.icon}
            <span className="relative z-10">{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`relative z-10 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                  hasAction
                    ? isActive
                      ? 'bg-[#B45309] text-white'
                      : 'bg-amber-50 text-[#B45309] border border-amber-200'
                    : isActive
                      ? 'bg-[#222222] text-white'
                      : 'bg-[#E5E7EB] text-[#374151]'
                }`}
              >
                {hasAction && (
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${isActive ? 'bg-white' : 'bg-[#B45309]'}`} />
                )}
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
// 4. STAT CARD COMPONENT (Metric / KPI Tile — Monochrome Clean)
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
  interactive?: boolean;
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
  interactive = true,
  onClick
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={interactive ? { y: -4, borderColor: '#9CA3AF' } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-none group relative overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-display font-bold uppercase tracking-wider text-[#6B7280] truncate">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-[#0A0A0A] shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-display font-black text-[#0A0A0A] tracking-tight">
          {value}
        </span>
        {trend && (
          <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full border bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]">
            {trend.value}
          </span>
        )}
      </div>

      {(subtext || badge || hoverDetail) && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-[#6B7280] font-medium min-h-[20px] relative">
          <div className="flex-1 min-w-0">
            {hoverDetail ? (
              <AnimatePresence mode="wait">
                {isHovered ? (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="text-[11px] font-bold text-[#0A0A0A] flex items-center gap-1 font-mono"
                  >
                    <span>↑</span> {hoverDetail}
                  </motion.div>
                ) : (
                  <motion.div
                    key="subtext"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="truncate"
                  >
                    {subtext}
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <span>{subtext}</span>
            )}
          </div>
          {badge && <div className="shrink-0 ml-2">{badge}</div>}
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// 5. REUSABLE MOTION CARD COMPONENT
// ============================================================================
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  interactive = false,
  onClick
}) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={interactive ? { y: -4, borderColor: '#9CA3AF' } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-none ${interactive ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// 6. REUSABLE MODAL WRAPPER COMPONENT (Framer Motion Enter/Exit)
// ============================================================================
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  icon?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
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
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className={`relative bg-white border border-[#E5E7EB] rounded-t-2xl sm:rounded-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5 sm:space-y-6 shadow-2xl font-sans text-xs z-10 pb-safe ${getMaxWidthClass()} ${className}`}
          >
            {/* Mobile Bottom Sheet Drag Indicator */}
            <div className="sm:hidden flex justify-center -mt-2 mb-1">
              <div className="w-10 h-1 rounded-full bg-[#CBD5E1]" />
            </div>

            {(title || subtitle) && (
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {icon && (
                    <div className="w-9 h-9 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    {title && (
                      <h3 className="font-display font-bold text-sm text-[#0A0A0A] truncate">
                        {title}
                      </h3>
                    )}
                    {subtitle && (
                      <p className="text-xs text-[#6B7280] font-medium mt-0.5 truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
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

// ============================================================================
// 7. REUSABLE TOAST NOTICE COMPONENT
// ============================================================================
export interface ToastNoticeProps {
  message: string | null;
  onClose?: () => void;
  variant?: 'success' | 'amber' | 'info';
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
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          className={`p-3.5 rounded-xl font-bold flex items-center justify-between gap-3 text-xs shadow-sm ${
            variant === 'amber'
              ? 'bg-[#FFFBEB] text-[#92400E] border border-[#FCD34D]'
              : variant === 'info'
              ? 'bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD]'
              : 'bg-[#0A0A0A] text-white border border-[#222222]'
          } ${className}`}
        >
          <div className="flex items-center gap-2.5">
            {variant === 'amber' ? (
              <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0" />
            ) : variant === 'info' ? (
              <Info className="w-4 h-4 text-[#0284C7] shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            )}
            <span>{message}</span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="opacity-70 hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
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
// 8. EMPTY STATE COMPONENT
// ============================================================================
export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = ''
}) => {
  return (
    <div
      className="bg-white border border-[#E5E7EB] rounded-xl p-10 flex flex-col items-center justify-center text-center shadow-none space-y-4"
    >
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] text-[#0A0A0A] flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="max-w-md space-y-1.5">
        <h3 className="text-base font-display font-bold text-[#0A0A0A] tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-[#6B7280] font-medium leading-relaxed">
          {description}
        </p>
      </div>
      {action && (
        <Button variant="primary" size="md" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
};

// ============================================================================
// 9. ANIMATED CHECKMARK ICON (SVG Stroke Drawing Animation for Success Actions)
// ============================================================================
export const AnimatedCheckIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-5 h-5 text-emerald-600',
  size = 20
}) => (
  <motion.svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <motion.path
      d="M20 6L9 17l-5-5"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    />
  </motion.svg>
);
