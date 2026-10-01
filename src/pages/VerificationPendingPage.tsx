import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Badge, Button, FileDropzone } from '../components/common/UIComponents';
import { uploadProofDocument } from '../lib/storage';
import {
  Clock,
  Check,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';

interface VerificationPendingPageProps {
  setActiveTab?: (tab: string) => void;
}

export const VerificationPendingPage: React.FC<VerificationPendingPageProps> = ({ setActiveTab }) => {
  const { currentUser, logout, updateCurrentUserState } = useAuth();
  const { allUsers, resubmitUserVerification } = useData();

  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [resubmitFileName, setResubmitFileName] = useState<string>('');
  const [resubmitFileUrl, setResubmitFileUrl] = useState<string>('');
  const [notice, setNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    document.title = "Verification pending | NexaLink";
  }, []);

  if (!currentUser) return null;

  const latestUser = allUsers.find(u => u.id === currentUser.id) || currentUser;
  const isNeedsClarification = latestUser.verificationStatus === 'Needs Clarification' || !!latestUser.clarificationRequested;
  const isRejected = latestUser.verificationStatus === 'Rejected';
  const clarificationPrompt = latestUser.clarificationRequested?.text || latestUser.clarificationRequest;

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4500);
  };

  const handleResubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitFileName) {
      showToast('Please select a proof document file to upload.', 'error');
      return;
    }

    resubmitUserVerification(latestUser.id, resubmitFileName, resubmitFileUrl);
    
    updateCurrentUserState({
      ...latestUser,
      verificationStatus: 'Pending Verification',
      proofDocumentName: resubmitFileName,
      verificationDocumentName: resubmitFileName,
      verificationDocumentUrl: resubmitFileUrl,
      clarificationRequested: null,
      clarificationRequest: undefined
    });

    setResubmitFile(null);
    setResubmitFileName('');
    setResubmitFileUrl('');
    showToast('Updated proof document submitted. Your verification is now pending admin review.', 'success');
  };

  const handleCheckStatus = () => {
    const updated = allUsers.find(u => u.id === currentUser.id);
    if (updated) {
      if (updated.isVerified || updated.verificationStatus === 'Verified') {
        updateCurrentUserState({ ...updated, isVerified: true, verificationStatus: 'Verified' });
        showToast('Your account has been verified. Access granted.', 'success');
        if (setActiveTab) setActiveTab('dashboard');
      } else if (updated.verificationStatus === 'Needs Clarification') {
        updateCurrentUserState(updated);
        showToast('Action required: Administrator requested clarification on your credentials.', 'info');
      } else if (updated.verificationStatus === 'Rejected') {
        updateCurrentUserState(updated);
        showToast(`Registration status: Rejected. Reason: ${updated.rejectionReason || 'Credential mismatch'}`, 'error');
      } else {
        showToast('Verification status: Pending. The administrator is reviewing your registration.', 'info');
      }
    } else {
      showToast('Verification status: Pending administrator review.', 'info');
    }
  };

  const handleLogout = () => {
    logout();
    if (setActiveTab) setActiveTab('landing');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 font-sans text-xs text-[#0A0A0A]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Notice Toast */}
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 border ${
              notice.type === 'success'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                : notice.type === 'error'
                ? 'bg-rose-50 text-rose-950 border-rose-200'
                : 'bg-amber-50 text-amber-950 border-amber-200'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : notice.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            )}
            <span>{notice.text}</span>
          </motion.div>
        )}

        {/* Status Centerpiece */}
        <motion.div variants={itemVariants} className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FAFAFA] border border-[#E5E7EB] rounded-full text-xs font-medium text-[#6B7280]">
            <span>VIT Wadala · Institutional gate</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0A0A0A] tracking-tight">
            Registration under review
          </h1>

          <div className="flex items-center justify-center pt-1">
            {isNeedsClarification ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-[#B45309] rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-[#B45309]" />
                <span>Action required: clarification requested</span>
              </div>
            ) : isRejected ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 text-[#991B1B] rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-[#991B1B]" />
                <span>Registration status: rejected</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-[#065F46]" />
                <span>Verification in progress</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stepper */}
        <motion.div variants={itemVariants} className="py-2">
          <div className="relative flex items-center justify-between max-w-xl mx-auto">
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E5E7EB] -z-0" />
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="absolute top-4 left-6 w-1/2 h-0.5 bg-[#0A0A0A] origin-left -z-0"
            />

            {/* Step 1: Registration */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-medium text-xs">
                <Check className="w-4 h-4 text-white stroke-[2.5]" />
              </div>
              <div className="mt-2 space-y-0.5">
                <span className="block font-medium text-xs text-[#0A0A0A]">
                  1. Registration
                </span>
                <span className="block text-[11px] text-[#6B7280]">
                  Completed
                </span>
              </div>
            </div>

            {/* Step 2: Verification */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-[#0A0A0A] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0A0A0A]" />
              </div>
              <div className="mt-2 space-y-0.5">
                <span className="block font-medium text-xs text-[#0A0A0A]">
                  2. Verification
                </span>
                <span className="block text-[11px] text-[#B45309] font-medium">
                  In progress
                </span>
              </div>
            </div>

            {/* Step 3: Access portal */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] text-[#6B7280] flex items-center justify-center text-xs">
                <span>3</span>
              </div>
              <div className="mt-2 space-y-0.5">
                <span className="block font-medium text-xs text-[#6B7280]">
                  3. Access portal
                </span>
                <span className="block text-[11px] text-[#6B7280]">
                  Pending unlock
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Policy Description */}
        <motion.div variants={itemVariants} className="text-center max-w-lg mx-auto space-y-1.5">
          <p className="text-xs text-[#374151] leading-relaxed">
            VIT Wadala administrators are verifying your academic enrollment and credentials against institutional records. You will receive full portal access upon verification.
          </p>
          <p className="text-[11px] text-[#6B7280]">
            Security policy: Unverified accounts cannot access institutional rosters, mentorship workflows, or direct messaging.
          </p>
        </motion.div>

        {/* Action Required: Clarification Box */}
        {isNeedsClarification && (
          <motion.div variants={itemVariants} className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#B45309] font-medium text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Action required: administrator requested clarification</span>
            </div>

            {clarificationPrompt && (
              <div className="bg-white border border-amber-200 rounded-lg p-3 text-xs text-[#78350F]">
                <strong>Admin note:</strong> “{clarificationPrompt}”
              </div>
            )}

            <form onSubmit={handleResubmitProof} className="space-y-4">
              <FileDropzone
                label="Upload updated proof document"
                accept="image/*,.pdf"
                maxSizeMB={5}
                selectedFile={resubmitFile}
                helperText="ID card, admit card, or degree certificate scan."
                onFileSelect={async file => {
                  setResubmitFile(file);
                  setResubmitFileName(file.name);
                  try {
                    const res = await uploadProofDocument(file, latestUser.id);
                    setResubmitFileUrl(res.url);
                  } catch {
                    const fakeUrl = URL.createObjectURL(file);
                    setResubmitFileUrl(fakeUrl);
                  }
                }}
                onFileRemove={() => {
                  setResubmitFile(null);
                  setResubmitFileName('');
                  setResubmitFileUrl('');
                }}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!resubmitFileName}
              >
                Submit updated proof to admin
              </Button>
            </form>
          </motion.div>
        )}

        {/* Submitted Profile Summary */}
        <motion.div variants={itemVariants} className="space-y-3 pt-4 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
              Submitted registration profile
            </h2>
            <span className="text-[11px] font-mono text-[#6B7280]">
              Ref ID: #{latestUser.id.slice(0, 8)}
            </span>
          </div>

          <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#6B7280]">Full name</span>
              <span className="font-medium text-[#0A0A0A]">{latestUser.name}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#6B7280]">Role requested</span>
              <span className="font-medium text-[#0A0A0A] capitalize">{latestUser.role}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#6B7280]">Department</span>
              <span className="font-medium text-[#0A0A0A]">{latestUser.department}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#6B7280]">Primary email</span>
              <span className="font-mono text-[#0A0A0A]">{latestUser.email}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#6B7280]">ID / enrollment number</span>
              <span className="font-mono text-[#0A0A0A]">
                {(latestUser as any).enrollmentNo || (latestUser as any).employeeId || (latestUser as any).prn || '22101A0099'}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <span className="text-[#6B7280]">Proof document</span>
              <div>
                {latestUser.verificationDocumentUrl || latestUser.verificationDocumentName || (latestUser as any).proofDocumentName ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#0A0A0A] max-w-[180px] sm:max-w-xs truncate">
                      {latestUser.verificationDocumentName || (latestUser as any).proofDocumentName || 'Proof_Document.pdf'}
                    </span>
                    <Badge variant="emerald" size="sm">
                      On file
                    </Badge>
                    {latestUser.verificationDocumentUrl && (
                      <a
                        href={latestUser.verificationDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#0A0A0A] hover:underline"
                        title="View document"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[#6B7280] italic">No document on file</span>
                    {!isNeedsClarification && (
                      <label className="cursor-pointer">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="pointer-events-none"
                        >
                          Attach document
                        </Button>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={async e => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              try {
                                const res = await uploadProofDocument(file, latestUser.id);
                                resubmitUserVerification(latestUser.id, file.name, res.url);
                                updateCurrentUserState({
                                  ...latestUser,
                                  verificationStatus: 'Pending Verification',
                                  proofDocumentName: file.name,
                                  verificationDocumentUrl: res.url
                                });
                                showToast('Document attached successfully.', 'success');
                              } catch {
                                showToast('Failed to upload file.', 'error');
                              }
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Controls */}
        <motion.div variants={itemVariants} className="pt-2 flex flex-col items-center gap-3 text-center">
          <Button
            onClick={handleCheckStatus}
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            <span>Check verification status</span>
          </Button>

          <button
            onClick={handleLogout}
            className="text-xs font-medium text-[#6B7280] hover:text-[#0A0A0A] underline transition cursor-pointer flex items-center gap-1.5 touch-target-44"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out / Return to login</span>
          </button>
        </motion.div>

        {/* Expected Timeline */}
        <motion.div variants={itemVariants} className="pt-4 border-t border-[#E5E7EB] text-center space-y-1 text-xs text-[#6B7280]">
          <p>
            Expected timeline: Typically reviewed within 1–2 business days by institutional administration.
          </p>
          <p>
            Questions? Contact{' '}
            <a href="mailto:alumni@vit.edu.in" className="font-medium text-[#0A0A0A] underline">
              alumni@vit.edu.in
            </a>
          </p>
        </motion.div>

      </motion.div>
    </div>
  );
};
