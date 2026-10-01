import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps {
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  cornerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  hint,
  error,
  required = false,
  cornerAction,
  children,
  className = ''
}) => {
  const shouldReduceMotion = useReducedMotion();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-sm font-medium text-[#0A0A0A] flex items-center gap-1 select-none"
        >
          <span>{label}</span>
          {required && (
            <span className="text-[#DC2626] text-xs font-normal" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {cornerAction && <div className="text-xs">{cornerAction}</div>}
      </div>

      <div className="w-full relative">
        {children}
      </div>

      {/* Helper hint or inline role hint */}
      {hint && !error && (
        <div id={hintId} className="text-[13px] text-[#6B7280] leading-snug">
          {hint}
        </div>
      )}

      {/* Error message with animated height */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            id={errorId}
            role="alert"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, height: 0, y: -4 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto', y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex items-center gap-1.5 text-xs text-[#DC2626] font-medium pt-0.5 overflow-hidden"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
