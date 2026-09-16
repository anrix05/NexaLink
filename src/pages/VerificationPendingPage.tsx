import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Badge, Button } from '../components/common/UIComponents';
import { uploadProofDocument } from '../lib/storage';
import {
  Clock,
  Check,
  CheckCircle2,
  FileText,
  Upload,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ShieldAlert,
  ExternalLink,
  User,
  Building2,
  Mail,
  GraduationCap
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

  if (!currentUser) return null;

  // Find latest record in DataContext allUsers store
  const latestUser = allUsers.find(u => u.id === currentUser.id) || currentUser;
  const isNeedsClarification = latestUser.verificationStatus === 'Needs Clarification' || !!latestUser.clarificationRequested;
  const isRejected = latestUser.verificationStatus === 'Rejected';
  const clarificationPrompt = latestUser.clarificationRequested?.text || latestUser.clarificationRequest;

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4500);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResubmitFile(file);
      setResubmitFileName(file.name);
      try {
        const res = await uploadProofDocument(file, latestUser.id);
        setResubmitFileUrl(res.url);
      } catch {
        const fakeUrl = URL.createObjectURL(file);
        setResubmitFileUrl(fakeUrl);
      }
    }
  };

  const handleResubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitFileName) {
      showToast('Please select a proof document file to upload.', 'error');
      return;
    }

    resubmitUserVerification(latestUser.id, resubmitFileName, resubmitFileUrl);
    
    // Update local session state
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
    showToast('Updated proof document submitted! Your verification is now pending admin review.', 'success');
  };

  const handleCheckStatus = () => {
    const updated = allUsers.find(u => u.id === currentUser.id);
    if (updated) {
      if (updated.isVerified || updated.verificationStatus === 'Verified') {
        updateCurrentUserState({ ...updated, isVerified: true, verificationStatus: 'Verified' });
        showToast('Congratulations! Your account has been verified. Access granted.', 'success');
        if (setActiveTab) setActiveTab('dashboard');
      } else if (updated.verificationStatus === 'Needs Clarification') {
        updateCurrentUserState(updated);
        showToast('Action Required: Administrator requested clarification on your credentials.', 'info');
      } else if (updated.verificationStatus === 'Rejected') {
        updateCurrentUserState(updated);
        showToast(`Registration status: Rejected. Reason: ${updated.rejectionReason || 'Credential Mismatch'}`, 'error');
      } else {
        showToast('Verification status: Pending. The administrator is currently reviewing your registration.', 'info');
      }
    } else {
      showToast('Verification status: Pending administrator review.', 'info');
    }
  };

  const handleLogout = () => {
    logout();
    if (setActiveTab) setActiveTab('landing');
  };

  // Staggered entrance variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 font-sans text-xs text-[#0A0A0A]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* Notice Toast */}
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              notice.type === 'success'
                ? 'bg-[#0A0A0A] text-white'
                : notice.type === 'error'
                ? 'bg-rose-950 text-rose-100 border border-rose-800'
                : 'bg-amber-950 text-amber-100 border border-amber-800'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : notice.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{notice.text}</span>
          </motion.div>
        )}

        {/* 1. STATUS AS THE VISUAL CENTERPIECE (Focal Point) */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FAFAFA] border border-[#E5E7EB] rounded-full text-[10px] font-mono font-bold uppercase tracking-widest text-[#6B7280]">
            <span>VIT Wadala • Institutional Gate</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-[#0A0A0A] tracking-tight">
            Registration Under Review
          </h1>

          {/* Focal Status Pill with Pulsing Live Indicator */}
          <div className="flex items-center justify-center pt-1">
            {isNeedsClarification ? (
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-bold shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
                </span>
                <span>Action Required: Clarification Requested</span>
              </div>
            ) : isRejected ? (
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-900 rounded-full text-xs font-bold shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                </span>
                <span>Registration Status: Rejected</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] rounded-full text-xs font-bold shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <span>Verification in Progress</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* 2. CONNECTED STEPPER COMPONENT (Horizontal connected line with node draw & pulse) */}
        <motion.div variants={itemVariants} className="py-4">
          <div className="relative flex items-center justify-between max-w-xl mx-auto">
            {/* Background Line Track */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E5E7EB] -z-0" />

            {/* Animated Solid Line Draw (Step 1 to Step 2) */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-4 left-6 w-1/2 h-0.5 bg-[#0A0A0A] origin-left -z-0"
            />

            {/* Step 1 Node: Registration (Completed) */}
            <div className="relative z-10 flex flex-col items-center text-center group cursor-default">
              <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                <Check className="w-4 h-4 text-white stroke-[3]" />
              </div>
              <div className="mt-3 space-y-0.5">
                <span className="block font-display font-bold text-xs text-[#0A0A0A] uppercase tracking-wider">
                  1. Registration
                </span>
                <span className="block text-[11px] text-[#6B7280] font-medium">
                  Completed
                </span>
              </div>
            </div>

            {/* Step 2 Node: Verification (Active Step with Gentle Continuous Pulse) */}
            <div className="relative z-10 flex flex-col items-center text-center group cursor-default">
              <div className="relative flex items-center justify-center">
                {/* Continuous Pulse Ring */}
                <motion.div
                  animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-9 h-9 rounded-full bg-amber-400/40"
                />
                <div className="w-8 h-8 rounded-full bg-white border-2 border-[#0A0A0A] flex items-center justify-center relative z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0A0A0A]" />
                </div>
              </div>
              <div className="mt-3 space-y-0.5">
                <span className="block font-display font-bold text-xs text-[#0A0A0A] uppercase tracking-wider">
                  2. Verification
                </span>
                <span className="block text-[11px] text-[#92400E] font-bold">
                  In Progress
                </span>
              </div>
            </div>

            {/* Step 3 Node: Access Portal (Pending) */}
            <div className="relative z-10 flex flex-col items-center text-center group cursor-default">
              <div className="w-8 h-8 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] text-[#9CA3AF] flex items-center justify-center font-bold text-xs">
                <span>3</span>
              </div>
              <div className="mt-3 space-y-0.5">
                <span className="block font-display font-bold text-xs text-[#9CA3AF] uppercase tracking-wider">
                  3. Access Portal
                </span>
                <span className="block text-[11px] text-[#9CA3AF] font-medium">
                  Pending Unlock
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. EXPLANATION MESSAGE & SECURITY POLICY (Plain typography, no cards) */}
        <motion.div variants={itemVariants} className="text-center max-w-lg mx-auto space-y-2">
          <p className="text-xs text-[#374151] leading-relaxed font-medium">
            VIT Wadala Administrators are verifying your academic enrollment & credentials against institutional records. You will receive full portal access as soon as your account is approved.
          </p>
          <p className="text-[11px] text-[#9CA3AF] font-mono">
            Security Policy: Unverified accounts are restricted from accessing institutional rosters, mentorship workflows, and direct messaging.
          </p>
        </motion.div>

        {/* Action Required: Clarification Box if requested by Admin */}
        {isNeedsClarification && (
          <motion.div variants={itemVariants} className="bg-[#FFFBEB] border border-[#FCD34D] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#B45309] font-display font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Action Required: Administrator Requested Clarification</span>
            </div>

            {clarificationPrompt && (
              <div className="bg-white/80 border border-[#FDE68A] rounded-lg p-3 text-xs text-[#92400E] font-medium">
                <strong>Admin Instructions:</strong> “{clarificationPrompt}”
              </div>
            )}

            <form onSubmit={handleResubmitProof} className="space-y-3">
              <div>
                <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#78350F] mb-1">
                  Upload Updated Proof Document (ID Card / Admit Card / Degree Certificate)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<Upload className="w-3.5 h-3.5" />}
                      className="pointer-events-none"
                    >
                      {resubmitFileName || 'Select Proof File (PDF / Image)'}
                    </Button>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {resubmitFileName && (
                    <span className="text-[11px] font-mono text-[#92400E] truncate max-w-xs">
                      {resubmitFileName}
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full sm:w-auto"
                disabled={!resubmitFileName}
              >
                Submit Updated Proof to Admin
              </Button>
            </form>
          </motion.div>
        )}

        {/* 4. SIMPLIFIED SUBMITTED PROFILE (Quiet reference list, no card borders) */}
        <motion.div variants={itemVariants} className="space-y-3 pt-4 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xs font-display font-bold uppercase tracking-wider text-[#6B7280]">
              Submitted Registration Profile
            </h2>
            <span className="text-[10px] font-mono text-[#9CA3AF]">
              Ref ID: #{latestUser.id.slice(0, 8)}
            </span>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#6B7280] font-medium">Full Name</span>
              <span className="font-bold text-[#0A0A0A]">{latestUser.name}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#6B7280] font-medium">Role Requested</span>
              <span className="font-bold text-[#0A0A0A] capitalize">{latestUser.role}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#6B7280] font-medium">Department</span>
              <span className="font-bold text-[#0A0A0A]">{latestUser.department}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#6B7280] font-medium">Primary Email</span>
              <span className="font-mono font-medium text-[#0A0A0A]">{latestUser.email}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#6B7280] font-medium">ID / Enrollment No</span>
              <span className="font-mono font-medium text-[#0A0A0A]">
                {(latestUser as any).enrollmentNo || (latestUser as any).employeeId || (latestUser as any).prn || '22101A0099'}
              </span>
            </div>

            {/* Proof Document Status Row */}
            <div className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <span className="text-[#6B7280] font-medium">Proof Document</span>
              <div>
                {latestUser.verificationDocumentUrl || latestUser.verificationDocumentName || (latestUser as any).proofDocumentName ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#0A0A0A] font-medium max-w-[180px] sm:max-w-xs truncate">
                      {latestUser.verificationDocumentName || (latestUser as any).proofDocumentName || 'Proof_Document.pdf'}
                    </span>
                    <Badge variant="emerald" size="sm">
                      ✓ On File
                    </Badge>
                    {latestUser.verificationDocumentUrl && (
                      <a
                        href={latestUser.verificationDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0A0A0A] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[#9CA3AF] italic">No document on file</span>
                    {!isNeedsClarification && (
                      <form onSubmit={handleResubmitProof} className="inline-flex items-center gap-2">
                        <label className="cursor-pointer">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<Upload className="w-3.5 h-3.5" />}
                            className="pointer-events-none"
                          >
                            {resubmitFileName ? resubmitFileName : 'Attach Document'}
                          </Button>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        {resubmitFileName && (
                          <Button type="submit" variant="primary" size="sm">
                            Submit
                          </Button>
                        )}
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 5. ACTION CONTROLS & QUIET SECONDARY LINKS */}
        <motion.div variants={itemVariants} className="pt-4 flex flex-col items-center gap-4 text-center">
          <Button
            onClick={handleCheckStatus}
            variant="primary"
            size="lg"
            icon={<RefreshCw className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Check Verification Status
          </Button>

          <button
            onClick={handleLogout}
            className="text-xs font-bold text-[#6B7280] hover:text-[#0A0A0A] underline underline-offset-4 transition cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Back to Login</span>
          </button>
        </motion.div>

        {/* 6. EXPECTED TIMELINE & ESCALATION CONTACT (Plain quiet text) */}
        <motion.div variants={itemVariants} className="pt-6 border-t border-[#E5E7EB] text-center space-y-1 text-xs text-[#6B7280]">
          <p className="font-medium">
            Expected Timeline: Typically reviewed within 1–2 business days by the institutional registrar.
          </p>
          <p>
            Questions about your verification? Contact{' '}
            <a href="mailto:alumni@vit.edu.in" className="font-bold text-[#0A0A0A] underline hover:text-[#2563EB]">
              alumni@vit.edu.in
            </a>
          </p>
        </motion.div>

      </motion.div>
    </div>
  );
};


