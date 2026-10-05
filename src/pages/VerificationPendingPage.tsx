import React, { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ReviewStatusHero, VerificationStepper } from '../components/gate/ReviewStatusHero';
import type { GateDerivedState } from '../components/gate/ReviewStatusHero';
import { FocusPanel } from '../components/gate/FocusPanel';
import { OnboardingChecklist } from '../components/gate/OnboardingChecklist';
import { DetailsList } from '../components/gate/DetailsList';
import { EditDetailsSheet } from '../components/gate/EditDetailsSheet';
import { ActivityList } from '../components/gate/ActivityList';
import { UploadDocumentModal } from '../components/gate/UploadDocumentModal';
import { VerifyRecoveryModal } from '../components/gate/VerifyRecoveryModal';
import { DevStateSwitcher } from '../components/gate/DevStateSwitcher';
import { useVerificationState } from '../hooks/useVerificationState';
import { SUPPORT_EMAIL } from '../config/auth';
import { ArrowRight, RefreshCw, AlertCircle, FilePlus } from 'lucide-react';
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

  // Dev state override for testing
  const [devStateOverride, setDevStateOverride] = useState<GateDerivedState | null>(null);

  // 4 Core States driven by verificationStatus + clarificationRequested
  const computeDerivedState = (): 'in_review' | 'action_needed' | 'rejected' | 'verified' => {
    if (devStateOverride) {
      if (devStateOverride === 'action_needed' || devStateOverride === 'needs_clarification') {
        return 'action_needed';
      }
      if (devStateOverride === 'rejected') return 'rejected';
      if (devStateOverride === 'verified') return 'verified';
      return 'in_review';
    }

    const currentStatus = state?.status || currentUser?.verificationStatus || 'Pending Verification';
    const clarObj = state?.clarification || currentUser?.clarificationRequested || currentUser?.clarificationRequest;

    if (currentStatus === 'Verified' || currentUser?.isVerified) {
      return 'verified';
    }
    if (currentStatus === 'Rejected') {
      return 'rejected';
    }
    if (currentStatus === 'Needs Clarification' || Boolean(clarObj)) {
      return 'action_needed';
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
    recoveryEmailVerified: Boolean(currentUser.emailConfirmedAt || currentUser.email_confirmed_at),
    recoveryEmailMasked: currentUser.personalEmail || currentUser.email,
    userReplied: Boolean(currentUser.userReplied),
    userRepliedAt: currentUser.userRepliedAt,
    clarification: currentUser.clarificationRequested
      ? {
          reason: currentUser.clarificationRequested.text || currentUser.clarificationRequested.reason || '',
          documentType: currentUser.clarificationRequested.documentType || 'College ID',
          requestedAt: currentUser.clarificationRequested.requestedAt || new Date().toISOString(),
          originalDocumentName: currentUser.proofDocumentName
        }
      : null,
    rejectionReason: currentUser.rejectionReason || null,
    activity: []
  };

  const isAlumni = currentUser.role === 'alumni';
  const canEditDetails = derivedState === 'in_review' || derivedState === 'action_needed' || derivedState === 'rejected';

  // Handle document submission inside FocusPanel
  const handleFocusPanelUpload = async (file: File) => {
    if (!currentUser.id) return { ok: false, error: 'User session not found' };

    const replaceRes = await replaceDocument(file);
    if (!replaceRes.ok) {
      return { ok: false, error: replaceRes.error || 'Failed to upload document.' };
    }

    const docUrl = (replaceRes as any).url || (replaceRes as any).path || file.name;
    resubmitUserVerification(currentUser.id, file.name, docUrl);

    // Immediately update currentUser state in AuthContext so whole UI knows user replied
    updateCurrentUserState({
      ...currentUser,
      proofDocumentName: file.name,
      verificationDocumentName: file.name,
      verificationDocumentUrl: docUrl,
      verificationStatus: 'Pending Verification',
      userReplied: true,
      userRepliedAt: new Date().toISOString()
    });

    await refresh();
    return { ok: true };
  };

  const isUserReplied = Boolean(effectiveState.userReplied || currentUser.userReplied);

  return (
    <div className="w-full flex flex-col gap-8 pb-16">
      {/* 1. STATE 2 (Action needed): Heading -> FocusPanel (#FAFAFA, no border) -> Stepper below it */}
      {derivedState === 'action_needed' ? (
        <div className="w-full flex flex-col gap-6">
          <ReviewStatusHero
            state="action_needed"
            hideStepper={true}
          />

          {/* ONE FocusPanel directly under heading: #FAFAFA, 12px radius, no border */}
          <FocusPanel
            message={effectiveState.clarification?.reason || currentUser.clarificationRequest || 'Please provide an updated institutional verification document.'}
            requestedAt={effectiveState.clarification?.requestedAt}
            documentType={effectiveState.clarification?.documentType || 'College ID'}
            originalDocumentName={effectiveState.documentName || currentUser.proofDocumentName}
            isSent={isUserReplied}
            uploadedFileName={effectiveState.documentName || currentUser.proofDocumentName}
            onSendDocument={handleFocusPanelUpload}
          />

          {/* Stepper below FocusPanel (Verification node is Amber) */}
          <VerificationStepper
            isVerified={false}
            isRejected={false}
            isAmber={true}
          />
        </div>
      ) : (
        /* STATES 1, 3, 4: ReviewStatusHero with Stepper intact */
        <ReviewStatusHero state={derivedState} />
      )}

      {/* STATE 1: Alumni Optional Document Link (NO big upload button) */}
      {derivedState === 'in_review' && isAlumni && (
        <div className="text-left -mt-4">
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="min-h-[44px] text-xs font-medium text-[#0A0A0A] hover:underline inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] rounded py-1 px-0.5"
          >
            <FilePlus className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>Add a document to speed things up</span>
          </button>
        </div>
      )}

      {/* STATE 3: Rejected Alert Box (Governance Rose, show reason and SUPPORT_EMAIL) */}
      {derivedState === 'rejected' && (
        <div className="p-4 rounded-xl border border-[#FECDD3] bg-[#FEF2F2] flex flex-col gap-3 text-left">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-[#991B1B]">
                Verification declined
              </span>
              <p className="text-xs text-[#991B1B] leading-relaxed">
                {effectiveState.rejectionReason || currentUser.rejectionReason || 'The submitted credentials could not be verified against institutional records.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#FECDD3]/70">
            <button
              type="button"
              onClick={() => setEditSheetOpen(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-xs font-medium hover:bg-[#262626] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
            >
              Edit details and resubmit
            </button>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=NexaLink%20Registration%20Appeal`}
              className="min-h-[44px] text-xs text-[#0A0A0A] underline hover:text-[#6B7280] font-medium flex items-center"
            >
              Contact support ({SUPPORT_EMAIL})
            </a>
          </div>
        </div>
      )}

      {/* STATE 4: Approved Action Button */}
      {derivedState === 'verified' && (
        <div className="w-full">
          <button
            type="button"
            onClick={() => setActiveTab?.('dashboard')}
            className="w-full min-h-[48px] rounded-lg bg-[#059669] text-[#FFFFFF] text-sm font-medium hover:bg-[#047857] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#059669]"
          >
            <span>Enter portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Unboxed "What happens next" Checklist with Hairline Dividers (Open Canvas Rule) */}
      <OnboardingChecklist
        state={effectiveState}
        derivedState={derivedState}
        onVerifyRecoveryClick={() => setRecoveryModalOpen(true)}
      />

      {/* 3. In Review Live Status Banner */}
      {derivedState === 'in_review' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-3 px-3.5 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-[#6B7280]">
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
            className="text-[#0A0A0A] hover:underline font-medium inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] rounded p-1 min-h-[44px] shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      )}

      {/* 4. Your Details Section */}
      <DetailsList
        user={currentUser}
        canEdit={canEditDetails}
        onEditClick={() => setEditSheetOpen(true)}
      />

      {/* 5. Activity Timeline */}
      <ActivityList activity={effectiveState.activity} />

      {/* 6. Security Note */}
      <div className="p-3.5 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-[#6B7280] text-left">
        <p>
          Until your account is verified, directory, mentorship, and messaging stay protected.
        </p>
      </div>

      {/* 7. Footer */}
      <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
        <span>
          Questions?{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=NexaLink%20Verification%20Support`}
            className="text-[#0A0A0A] hover:underline font-medium"
          >
            Contact {SUPPORT_EMAIL}
          </a>
        </span>

        <button
          type="button"
          onClick={() => logout()}
          className="text-[#0A0A0A] hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] rounded p-1 min-h-[44px] flex items-center"
        >
          Sign out
        </button>
      </div>

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
        email={currentUser?.personalEmail || currentUser?.email || ''}
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

      {/* Dev-only State Switcher (only in DEV mode) */}
      {import.meta.env.DEV && (
        <DevStateSwitcher
          currentState={derivedState}
          onStateSelect={(forced) => setDevStateOverride(forced)}
        />
      )}
    </div>
  );
};
