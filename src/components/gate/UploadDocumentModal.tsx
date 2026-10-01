import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw } from 'lucide-react';
import { ProofUploader } from '../auth/ProofUploader';
import type { UserRole } from '../../types';

export interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: UserRole;
  onUpload: (file: File) => Promise<{ ok: boolean; error?: string }>;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  role = 'student',
  onUpload
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await onUpload(file);
      if (res.ok) {
        onClose();
      } else {
        setError(res.error || 'Failed to upload document.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onClose()}
            className="fixed inset-0 bg-[#0A0A0A]/40 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Modal / Sheet Container */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-modal-title"
            className="relative w-full max-w-[500px] bg-[#FFFFFF] rounded-t-2xl sm:rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden z-10 flex flex-col"
          >
            {/* Grab Handle for Mobile */}
            <div className="sm:hidden w-full flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#E5E7EB]" />
            </div>

            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 id="upload-modal-title" className="text-base font-medium text-[#0A0A0A]">
                  Institutional proof document
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Attach or replace your document for verification review.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close dialog"
                className="p-1 rounded text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <ProofUploader
                role={role as any}
                onFileSelect={(f) => {
                  setFile(f);
                  setError(null);
                }}
                onFileRemove={() => setFile(null)}
                error={error}
                disabled={isSubmitting}
              />

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 h-10 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!file || isSubmitting}
                  aria-busy={isSubmitting}
                  className="px-4 h-10 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-xs font-medium hover:bg-[#262626] transition-colors inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1 disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save document</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
