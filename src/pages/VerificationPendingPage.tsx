import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ReviewStatusHero } from '../components/gate/ReviewStatusHero';
import type { GateDerivedState } from '../components/gate/ReviewStatusHero';
import { OnboardingChecklist } from '../components/gate/OnboardingChecklist';
import { DetailsList } from '../components/gate/DetailsList';
import { EditDetailsSheet } from '../components/gate/EditDetailsSheet';
import { ActivityList } from '../components/gate/ActivityList';
import { UploadDocumentModal } from '../components/gate/UploadDocumentModal';
import { VerifyRecoveryModal } from '../components/gate/VerifyRecoveryModal';
import { DevStateSwitcher } from '../components/gate/DevStateSwitcher';
import { useVerificationState } from '../hooks/useVerificationState';
import { ProofUploader } from '../components/auth/ProofUploader';
import { ArrowRight, RefreshCw, Upload, Mail, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import type { UserRole } from '../types';

export interface VerificationPendingPageProps {
  setActiveTab?: (tab: string) => void;
}

export const VerificationPendingPage: React.FC<VerificationPendingPageProps> = ({ setActiveTab }) => {
  const { currentUser, logout, updateCurrentUserState } = useAuth();
  const { resubmitUserVerification } = useData();
  const shouldReduceMotion = useReducedMotion();

  const {
    state,
    isLoading,
    isRefreshing,
    refresh,
    updateDetails,
    replaceDocument,
    lastCheckedTime
  } = useVerificationState();

  // Modals & sheets state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Clarification reply state
  const [clarificationReply, setClarificationReply] = useState('');
  const [clarificationFile, setClarificationFile] = useState<File | null>(null);
  const [isSendingClarification, setIsSendingClarification] = useState(false);

  // Dev state override for instant testing
  const [devStateOverride, setDevStateOverride] = useState<GateDerivedState | null>(null);

  // Determine derived state
  const computeDerivedState = (): GateDerivedState => {
    if (devStateOverride) return devStateOverride;
    if (!state) return 'in_review';

    if (state.status === 'Verified' || currentUser?.isVerified) {
      return 'verified';
    }
    if (state.status === 'Rejected') {
      return 'rejected';
    }
    if (state.status === 'Needs Clarification') {
      return 'needs_clarification';
    }
    if (!state.hasDocument) {
      return 'needs_document';
    }
    if (!state.recoveryEmailVerified && currentUser?.role === 'student') {
      return 'needs_recovery_email';
    }
    return 'in_review';
  };

  const derivedState = computeDerivedState();

  // Auto-advance to portal on Verified state (suppressed when manually previewing in dev switcher)
  useEffect(() => {
    if (derivedState === 'verified' && !devStateOverride) {
      updateCurrentUserState({ isVerified: true, verificationStatus: 'Verified' });
      const timer = setTimeout(() => {
        if (!shouldReduceMotion && setActiveTab) {
          setActiveTab('dashboard');
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [derivedState, devStateOverride, shouldReduceMotion, setActiveTab, updateCurrentUserState]);

  // Handle Clarification Submit
  const handleClarificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    setIsSendingClarification(true);
    try {
      const docName = clarificationFile?.name || state?.documentName || 'updated_doc.pdf';
      const docUrl = clarificationFile ? URL.createObjectURL(clarificationFile) : '';

      resubmitUserVerification(currentUser.id, docName, docUrl);
      if (clarificationFile) {
        await replaceDocument(clarificationFile);
      }

      setClarificationReply('');
      setClarificationFile(null);
      await refresh();
    } finally {
      setIsSendingClarification(false);
    }
  };

  if (!currentUser) return null;

  // Fixed-height Skeleton Loading State (CLS = 0)
  if (isLoading && !state) {
    return (
      <div className="w-full flex flex-col gap-6 animate-pulse select-none" style={{ minHeight: '600px' }}>
        <div className="flex items-center justify-between">
          <div className="w-24 h-4 bg-[#E5E7EB] rounded" />
          <div className="w-20 h-5 bg-[#E5E7EB] rounded-full" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="w-3/4 h-8 bg-[#E5E7EB] rounded" />
          <div className="w-1/2 h-4 bg-[#E5E7EB] rounded" />
        </div>
        <div className="w-full h-12 bg-[#E5E7EB] rounded-lg mt-2" />
        <div className="w-full h-48 bg-[#E5E7EB] rounded-lg mt-4" />
      </div>
    );
  }

  const effectiveState = state || {
    status: currentUser.verificationStatus || 'Pending Verification',
    hasDocument: Boolean(currentUser.proofDocumentName || currentUser.verificationDocumentName),
    documentName: currentUser.proofDocumentName || currentUser.verificationDocumentName || 'college_id.pdf',
    submittedAt: currentUser.createdAt || new Date().toISOString(),
    etaAt: 'Friday, 3 October',
    queueAhead: 4,
    recoveryEmailVerified: Boolean(currentUser.personalEmail),
    recoveryEmailMasked: 'a•••@gmail.com',
    clarification: null,
    rejectionReason: null,
    activity: []
  };

  const canEditDetails = derivedState === 'needs_document' || derivedState === 'needs_recovery_email' || derivedState === 'in_review' || derivedState === 'needs_clarification' || derivedState === 'rejected';

  return (
    <div className="w-full flex flex-col gap-8 pb-16">
      {/* 1. Review Status Hero with 3-node Stepper */}
      <ReviewStatusHero state={derivedState} />

      {/* 2. State-Specific Prominent Alert / Clarification Action Block */}
      {derivedState === 'needs_clarification' && (
        <div className="p-4 rounded-lg border border-[#FDE68A] bg-[#FEF3C7]/40 flex flex-col gap-4 text-left">
          <div className="flex items-start gap-2.5">
            <MessageSquare className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[#0A0A0A]">
                Administrator note
              </span>
              <blockquote className="border-l-2 border-[#B45309] pl-3 text-xs text-[#0A0A0A] italic my-1">
                "{effectiveState.clarification?.reason || currentUser.clarificationRequest || 'Please provide a clear scan showing your full enrollment number and academic year.'}"
              </blockquote>
              {effectiveState.documentName && (
                <span className="text-xs text-[#6B7280]">
                  Original document: <span className="font-medium text-[#0A0A0A]">{effectiveState.documentName}</span>
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleClarificationSubmit} className="flex flex-col gap-3 pt-1">
            <div className="flex flex-col gap-1">
              <label htmlFor="clarification-reply" className="text-xs font-medium text-[#0A0A0A]">
                Your response (optional, max 500 characters)
              </label>
              <textarea
                id="clarification-reply"
                rows={3}
                maxLength={500}
                value={clarificationReply}
                onChange={(e) => setClarificationReply(e.target.value)}
                placeholder="Explain the update or provide additional context..."
                className="w-full p-2.5 rounded-lg border border-[#6B7280] bg-[#FFFFFF] text-xs text-[#0A0A0A] placeholder:text-[#6B7280] focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A] outline-none resize-none"
              />
            </div>

            <ProofUploader
              role={currentUser.role as any}
              label="Attach updated document"
              onFileSelect={setClarificationFile}
              onFileRemove={() => setClarificationFile(null)}
              uploadedFileName={clarificationFile?.name}
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={isSendingClarification}
                className="h-10 px-4 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-xs font-medium hover:bg-[#262626] transition-colors inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
              >
                {isSendingClarification ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending reply...</span>
                  </>
                ) : (
                  <>
                    <span>Send reply & resubmit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {derivedState === 'rejected' && (
        <div className="p-4 rounded-lg border border-[#FECDD3] bg-[#FEF2F2] flex flex-col gap-3 text-left">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[#991B1B]">
                Verification declined
              </span>
              <p className="text-xs text-[#991B1B]">
                {effectiveState.rejectionReason || currentUser.rejectionReason || 'The submitted credentials could not be verified against official college records.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-[#FECDD3]/60">
            <button
              type="button"
              onClick={() => setEditSheetOpen(true)}
              className="h-9 px-3.5 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-xs font-medium hover:bg-[#262626] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
            >
              Edit details and resubmit
            </button>
            <a
              href="mailto:registrar@vit.edu.in?subject=NexaLink%20Registration%20Appeal"
              className="text-xs text-[#0A0A0A] underline hover:text-[#6B7280] font-medium"
            >
              Contact the registrar
            </a>
          </div>
        </div>
      )}

      {/* 3. Onboarding Checklist ("What happens next") */}
      <OnboardingChecklist
        state={effectiveState}
        derivedState={derivedState}
        onUploadClick={() => setUploadModalOpen(true)}
        onVerifyRecoveryClick={() => setRecoveryModalOpen(true)}
      />

      {/* 4. Primary Action / Live Status Row */}
      <div className="w-full flex flex-col gap-3">
        {derivedState === 'needs_document' && (
          <div className="w-full">
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="w-full h-12 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-sm font-medium hover:bg-[#262626] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
            >
              <Upload className="w-4 h-4" />
              <span>Upload proof document</span>
            </button>
          </div>
        )}

        {derivedState === 'needs_recovery_email' && (
          <div className="w-full">
            <button
              type="button"
              onClick={() => setRecoveryModalOpen(true)}
              className="w-full h-12 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-sm font-medium hover:bg-[#262626] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
            >
              <Mail className="w-4 h-4" />
              <span>Verify recovery email</span>
            </button>
          </div>
        )}

        {derivedState === 'in_review' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-[#6B7280]">
            <span>
              We'll email you at{' '}
              <span className="text-[#0A0A0A] font-medium">
                {currentUser.email || currentUser.institutionalEmail}
              </span>{' '}
              when there's an update. Last checked {lastCheckedTime}.
            </span>
            <button
              type="button"
              onClick={() => refresh()}
              disabled={isRefreshing}
              className="text-[#0A0A0A] hover:underline font-medium inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] rounded p-0.5 shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        )}

        {derivedState === 'verified' && (
          <div className="w-full">
            <button
              type="button"
              onClick={() => setActiveTab?.('dashboard')}
              className="w-full h-12 rounded-lg bg-[#059669] text-[#FFFFFF] text-sm font-medium hover:bg-[#047857] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#059669]"
            >
              <span>Enter portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 5. Your Details Section */}
      <DetailsList
        user={currentUser}
        canEdit={canEditDetails}
        onEditClick={() => setEditSheetOpen(true)}
      />

      {/* 6. Activity Timeline (3-5 items with IST timestamps) */}
      <ActivityList activity={effectiveState.activity} />

      {/* 7. Security Note */}
      <div className="p-3.5 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-[#6B7280] text-left">
        <p>
          Until you're verified, the directory, mentorship, and messaging stay locked.
        </p>
      </div>

      {/* 8. Footer */}
      <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
        <span>
          Questions?{' '}
          <a
            href="mailto:alumni@vit.edu.in?subject=NexaLink%20Verification%20Support"
            className="text-[#0A0A0A] hover:underline font-medium"
          >
            Contact alumni@vit.edu.in
          </a>
        </span>

        <button
          type="button"
          onClick={() => logout()}
          className="text-[#0A0A0A] hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] rounded p-1"
        >
          Sign out
        </button>
      </div>

      {/* Sticky Mobile Bottom Bar for Needs Document State */}
      {derivedState === 'needs_document' && (
        <div className="sm:hidden sticky bottom-0 left-0 right-0 p-3 bg-[#FFFFFF] border-t border-[#E5E7EB] z-30 pb-safe">
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="w-full h-11 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-xs font-medium inline-flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload proof document</span>
          </button>
        </div>
      )}

      {/* Modals & Bottom Sheets */}
      <UploadDocumentModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        role={currentUser.role as UserRole}
        onUpload={async (file) => {
          const res = await replaceDocument(file);
          if (res.ok) await refresh();
          return res;
        }}
      />

      <VerifyRecoveryModal
        isOpen={recoveryModalOpen}
        onClose={() => setRecoveryModalOpen(false)}
        emailMasked={effectiveState.recoveryEmailMasked}
        onVerified={() => refresh()}
      />

      <EditDetailsSheet
        isOpen={editSheetOpen}
        onClose={() => setEditSheetOpen(false)}
        user={currentUser}
        onSave={async (patch) => {
          const res = await updateDetails(patch);
          if (res.ok) {
            updateCurrentUserState({
              ...currentUser,
              name: patch.name || currentUser.name,
              department: patch.department || currentUser.department,
              enrollmentNo: patch.enrollmentNo || currentUser.enrollmentNo,
              employeeId: patch.employeeId || currentUser.employeeId
            });
            await refresh();
          }
          return res;
        }}
      />

      {/* Dev-only State Switcher Popover */}
      <DevStateSwitcher
        currentState={derivedState}
        onStateSelect={(forced) => setDevStateOverride(forced)}
      />
    </div>
  );
};
