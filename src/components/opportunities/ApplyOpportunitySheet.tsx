import React, { useState, useRef } from 'react';
import type { JobListing, User, StudentProfile } from '../../types';
import { uploadResume } from '../../lib/storage';
import {
  X,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Button } from '../common/UIComponents';

interface ApplyOpportunitySheetProps {
  job: JobListing;
  currentUser: User | StudentProfile;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: { resumeUrl: string; coverNote?: string }) => Promise<{ success: boolean; error?: string }>;
}

export const ApplyOpportunitySheet: React.FC<ApplyOpportunitySheetProps> = ({
  job,
  currentUser,
  isOpen,
  onClose,
  onSubmit
}) => {
  const existingResume = (currentUser as any)?.resumeUrl || '';
  const [resumeUrl, setResumeUrl] = useState<string>(existingResume);
  const [resumeName, setResumeName] = useState<string>(() => {
    if (!existingResume) return '';
    const parts = existingResume.split('/');
    return decodeURIComponent(parts[parts.length - 1] || 'Resume on file.pdf');
  });

  const [isReplacingResume, setIsReplacingResume] = useState<boolean>(!existingResume);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [coverNote, setCoverNote] = useState('');
  const [shareConsent, setShareConsent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF resume files are accepted.');
      return;
    }

    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxBytes) {
      setUploadError('File size exceeds the 5 MB limit. Please select a smaller PDF.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadResume(file, currentUser.id);
      if (res.error) {
        setUploadError(`Upload failed: ${res.error}`);
      } else {
        setResumeUrl(res.url);
        setResumeName(file.name);
        setIsReplacingResume(false);
      }
    } catch {
      setUploadError('Failed to upload resume. Please check your network connection.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!resumeUrl) {
      setSubmitError('A PDF resume is required to apply for this opportunity.');
      return;
    }

    if (!shareConsent) {
      setSubmitError('Please agree to share your profile and resume with the publisher.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await onSubmit({
        resumeUrl,
        coverNote: coverNote.trim() || undefined
      });

      if (res.success) {
        setIsSubmittedSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setSubmitError(res.error || 'Failed to submit application. Please retry.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Network error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const publisherName = job.postedByAlumniName || 'the opportunity publisher';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-sheet-title"
      >
        {/* Top Header */}
        <div className="p-5 px-6 border-b border-[#E5E7EB] flex items-start justify-between gap-4 bg-white">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs mt-0.5">
              {job.companyLogo ? (
                <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-5 h-5 text-[#6B7280]" />
              )}
            </div>
            <div className="min-w-0">
              <h2 id="apply-sheet-title" className="font-bold text-base text-[#0A0A0A] tracking-tight leading-snug truncate">
                Apply for {job.title}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-0.5">
                <span className="font-semibold text-[#0A0A0A]">{job.company}</span>
                <span>•</span>
                <span>{job.location}</span>
                <span>•</span>
                <span className="font-medium text-[#0A0A0A]">{job.type}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F9FAFB] transition-colors shrink-0 disabled:opacity-50"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmittedSuccess ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#0A0A0A]">Application sent!</h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto leading-relaxed">
              Your verified academic profile and resume have been securely delivered to <strong className="text-[#0A0A0A]">{publisherName}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs font-sans">
            {/* Server / Validation Error Feedback */}
            {submitError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs font-medium">{submitError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 underline shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Resume Selection / Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#0A0A0A] text-xs">
                  Resume document <span className="text-rose-600">*</span>
                </label>
                <span className="text-[11px] text-[#6B7280]">PDF only (max 5 MB)</span>
              </div>

              {!isReplacingResume && resumeUrl ? (
                <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-[#0A0A0A] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-[#0A0A0A] text-xs truncate">
                        Resume on file: {resumeName || 'Profile_Resume.pdf'}
                      </p>
                      <p className="text-[11px] text-[#6B7280]">Saved to your verified student profile</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {resumeUrl.startsWith('http') && (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-[#6B7280] hover:text-[#0A0A0A] text-[11px] font-semibold flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsReplacingResume(true)}
                      className="px-2.5 py-1 text-xs font-bold text-[#0A0A0A] border border-[#E5E7EB] rounded-lg bg-white hover:bg-neutral-100 transition-colors"
                    >
                      Replace
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-[#D1D5DB] rounded-xl p-5 text-center cursor-pointer hover:border-[#0A0A0A] hover:bg-[#FAFAFA] transition-all ${
                      isUploading ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <UploadCloud className="w-6 h-6 text-[#6B7280] mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-[#0A0A0A]">
                      {isUploading ? 'Uploading PDF resume...' : 'Click to upload your resume'}
                    </p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      PDF documents up to 5 MB
                    </p>
                  </div>

                  {existingResume && isReplacingResume && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsReplacingResume(false)}
                        className="text-[11px] text-[#6B7280] hover:text-[#0A0A0A] font-semibold underline cursor-pointer"
                      >
                        Keep existing resume on file
                      </button>
                    </div>
                  )}

                  {uploadError && (
                    <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{uploadError}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Optional Cover Note */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#0A0A0A] text-xs">
                  Cover note <span className="text-[#6B7280] font-normal">(optional)</span>
                </label>
                <span className={`text-[11px] font-mono ${coverNote.length > 1000 ? 'text-rose-600 font-bold' : 'text-[#6B7280]'}`}>
                  {coverNote.length} / 1000
                </span>
              </div>
              <textarea
                value={coverNote}
                maxLength={1000}
                onChange={e => setCoverNote(e.target.value)}
                placeholder="Mention why you are interested in this position, relevant coursework, technical projects, or availability..."
                rows={3}
                className="w-full p-3 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:bg-white transition-colors"
              />
            </div>

            {/* Privacy Consent Checkbox */}
            <div className="p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={shareConsent}
                  onChange={e => {
                    setShareConsent(e.target.checked);
                    if (submitError) setSubmitError(null);
                  }}
                  className="mt-0.5 rounded border-[#D1D5DB] text-[#0A0A0A] focus:ring-[#0A0A0A] cursor-pointer"
                />
                <span className="text-xs text-[#374151] leading-relaxed">
                  I agree to share my verified academic profile, contact details, and resume with{' '}
                  <strong className="text-[#0A0A0A]">{publisherName}</strong> for application evaluation purposes.
                </span>
              </label>
            </div>

            {/* Submit Action Bar */}
            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={isSubmitting}
                onClick={onClose}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting || !resumeUrl || !shareConsent || isUploading}
                icon={isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              >
                {isSubmitting ? 'Submitting Application...' : 'Submit application'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
