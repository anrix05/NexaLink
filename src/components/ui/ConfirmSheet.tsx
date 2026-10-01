import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmSheet: React.FC<ConfirmSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  isLoading = false,
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          {/* Modal / Sheet Container */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            className="relative z-10 w-full max-w-lg bg-white rounded-t-2xl sm:rounded-xl border border-[#E5E7EB] shadow-sm p-6 space-y-4 max-h-[90vh] overflow-y-auto pb-safe"
          >
            {/* Grab Handle for Touch on Mobile */}
            <div className="w-10 h-1 bg-[#E5E7EB] rounded-full mx-auto sm:hidden mb-2" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="sheet-title" className="text-base font-semibold text-[#0A0A0A]">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {children && <div className="py-2 text-xs">{children}</div>}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-medium text-[#0A0A0A] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#FAFAFA] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {cancelLabel}
              </button>
              {onConfirm && (
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer ${
                    destructive
                      ? 'bg-[#991B1B] hover:bg-[#7F1D1D]'
                      : 'bg-[#0A0A0A] hover:bg-[#262626]'
                  }`}
                >
                  {isLoading ? 'Processing...' : confirmLabel}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
