import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, AlertCircle } from 'lucide-react';
import type { User, DepartmentCode } from '../../types';
import { FormField } from '../auth/FormField';
import { TextInput } from '../auth/TextInput';
import { Combobox } from '../auth/Combobox';
import { DEPARTMENTS } from '../../data/constants';

export interface EditDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (patch: {
    name?: string;
    department?: DepartmentCode;
    enrollmentNo?: string;
    employeeId?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}

export const EditDetailsSheet: React.FC<EditDetailsSheetProps> = ({
  isOpen,
  onClose,
  user,
  onSave
}) => {
  const [name, setName] = useState(user.name || '');
  const [department, setDepartment] = useState<string>(user.department || 'CMPN');
  const [idNumber, setIdNumber] = useState(user.enrollmentNo || user.employeeId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(user.name || '');
      setDepartment(user.department || 'CMPN');
      setIdNumber(user.enrollmentNo || user.employeeId || '');
      setFormError(null);
    }
  }, [isOpen, user]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Full legal name is required.');
      return;
    }

    setIsLoading(true);
    setFormError(null);

    const patch: Record<string, any> = {
      name: name.trim(),
      department: department as DepartmentCode
    };

    if (user.role === 'faculty') {
      patch.employeeId = idNumber.trim().toUpperCase();
    } else {
      patch.enrollmentNo = idNumber.trim().toUpperCase();
    }

    try {
      const res = await onSave(patch);
      if (!res.ok) {
        setFormError(res.error || 'Failed to update details. Please try again.');
      } else {
        onClose();
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const departmentOptions = DEPARTMENTS.map((d) => ({
    value: d.code,
    label: d.name,
    code: d.code
  }));

  const idLabel = user.role === 'faculty' ? 'Employee ID' : 'PRN';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isLoading && onClose()}
            className="fixed inset-0 bg-[#0A0A0A]/40 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Sheet / Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-details-title"
            className="relative w-full max-w-[500px] bg-[#FFFFFF] rounded-t-2xl sm:rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Mobile Grab Handle */}
            <div className="sm:hidden w-full flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#E5E7EB]" />
            </div>

            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 id="edit-details-title" className="text-base font-medium text-[#0A0A0A]">
                  Edit registration details
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Update your institutional details while your review is in progress.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                aria-label="Close dialog"
                className="p-1 rounded text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto">
              {formError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECDD3] text-xs text-[#991B1B] flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <FormField id="edit-name" label="Full legal name" required>
                <TextInput
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  disabled={isLoading}
                  autoComplete="name"
                />
              </FormField>

              {/* Department */}
              <FormField id="edit-dept" label="Department" required>
                <Combobox
                  id="edit-dept"
                  options={departmentOptions}
                  value={department}
                  onChange={(val) => setDepartment(val)}
                  disabled={isLoading}
                />
              </FormField>

              {/* PRN / Employee ID */}
              <FormField
                id="edit-id"
                label={idLabel}
                hint={`${idLabel} format will be verified against college records.`}
              >
                <TextInput
                  id="edit-id"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
                  placeholder={user.role === 'faculty' ? 'EMP-XXXX' : 'e.g. 24108B0033'}
                  disabled={isLoading}
                  className="font-mono"
                  autoCapitalize="characters"
                />
              </FormField>

              {/* Readonly Email */}
              <FormField
                id="edit-email"
                label="Email address"
                hint="Contact support to change your registered email address."
              >
                <TextInput
                  id="edit-email"
                  value={user.email || user.institutionalEmail || ''}
                  readOnly
                  disabled
                />
              </FormField>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5E7EB] mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 h-10 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  className="px-4 h-10 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-xs font-medium hover:bg-[#262626] transition-colors inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1 disabled:opacity-50"
                >
                  {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save changes</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
