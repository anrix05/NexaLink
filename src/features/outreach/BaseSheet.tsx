// ============================================================================
// NEXALINK V2.8: Base Sheet / Dialog Component
// Responsive modal: Bottom sheet below 1024px (capped 560px at >=640px)
// Centered dialog at >=1024px, scroll locked, safe area & keyboard aware
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BaseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
  ariaLabelledBy?: string;
}

export const BaseSheet: React.FC<BaseSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidthClass = 'max-w-lg',
  ariaLabelledBy = 'outreach-modal-title'
}) => {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const sheetRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Track window resize across 1024px breakpoint
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll lock and focus management
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Focus first focusable element inside
      setTimeout(() => {
        if (sheetRef.current) {
          const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
        // Focus trap
        if (e.key === 'Tab' && sheetRef.current) {
          const focusables = Array.from(
            sheetRef.current.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          );
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
        if (previouslyFocusedElementRef.current) {
          previouslyFocusedElementRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  // Touch swipe-down detection for mobile bottom sheet
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartY.current !== null && touchCurrentY.current !== null) {
      const deltaY = touchCurrentY.current - touchStartY.current;
      if (deltaY > 75) {
        onClose();
      }
    }
    touchStartY.current = null;
    touchCurrentY.current = null;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex justify-center bg-[#0A0A0A]/40 backdrop-blur-xs transition-opacity items-end lg:items-center p-0 lg:p-4"
        onClick={onClose}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <motion.div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          onClick={(e) => e.stopPropagation()}
          initial={isDesktop ? { opacity: 0, scale: 0.98 } : { opacity: 0, y: '100%' }}
          animate={isDesktop ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 }}
          exit={isDesktop ? { opacity: 0, scale: 0.98 } : { opacity: 0, y: '100%' }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`bg-white w-full ${maxWidthClass} sm:max-w-[560px] lg:max-w-[480px] rounded-t-2xl lg:rounded-2xl border border-[#E5E7EB] flex flex-col max-h-[90dvh] overflow-hidden focus:outline-none`}
        >
          {/* Mobile Drag Handle (below 1024px) */}
          <div className="lg:hidden flex items-center justify-center pt-2.5 pb-1 cursor-grab shrink-0">
            <div className="w-10 h-1 bg-[#D1D5DB] rounded-full" />
          </div>

          {/* Header */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between shrink-0 bg-white">
            <h2 id={ariaLabelledBy} className="text-sm font-bold text-[#0A0A0A] truncate pr-2">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="min-w-[44px] min-h-[44px] -mr-2.5 flex items-center justify-center text-[#6B7280] hover:text-[#0A0A0A] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body with internal scrolling */}
          <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1 min-h-0 text-xs">
            {children}
          </div>

          {/* Sticky Footer */}
          {footer && (
            <div className="px-4 sm:px-6 py-3.5 border-t border-[#E5E7EB] bg-[#FAFAFA] shrink-0">
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
