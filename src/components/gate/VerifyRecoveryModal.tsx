import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { OtpInput } from '../auth/OtpInput';
import { authService } from '../../services/authService';

export interface VerifyRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailMasked?: string;
  onVerified: () => void;
}

export const VerifyRecoveryModal: React.FC<VerifyRecoveryModalProps> = ({
  isOpen,
  onClose,
  emailMasked = 'personal email',
  onVerified
}) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async (enteredCode: string) => {
    setIsVerifying(true);
    setError(null);
    try {
      const res = await authService.verifyRecoveryOtp(enteredCode);
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1200);
      } else {
        setError(res.error || 'Invalid verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
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
            onClick={() => !isVerifying && onClose()}
            className="fixed inset-0 bg-[#0A0A0A]/40 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="recovery-modal-title"
            className="relative w-full max-w-[480px] bg-[#FFFFFF] rounded-t-2xl sm:rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden z-10 flex flex-col p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 id="recovery-modal-title" className="text-base font-medium text-[#0A0A0A]">
                  Verify recovery email
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Confirm your backup email for post-graduation access.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isVerifying}
                aria-label="Close dialog"
                className="p-1 rounded text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="pt-4 flex flex-col gap-4">
              <OtpInput
                value={code}
                onChange={setCode}
                onComplete={handleComplete}
                isVerified={isSuccess}
                error={error}
                emailDestination={emailMasked}
                disabled={isVerifying}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
