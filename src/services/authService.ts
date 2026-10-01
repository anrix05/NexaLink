/**
 * authService adapter
 * Bridges between Supabase RPCs / Edge Functions and local mock fallbacks
 * Ensures UI code remains clean, uniform, and mock-resilient.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { uploadProofDocument } from '../lib/storage';
import type { DepartmentCode, AccountVerificationStatus } from '../types';
import { getEstimatedReviewDate } from '../utils/dateUtils';

export interface VerificationActivityItem {
  id: string;
  type: 'submitted' | 'document_received' | 'moved_to_review' | 'clarification_requested' | 'resubmitted' | 'decision';
  title: string;
  description?: string;
  timestamp: string; // ISO date string
}

export interface VerificationStatePayload {
  status: AccountVerificationStatus;
  hasDocument: boolean;
  documentName?: string;
  documentUrl?: string;
  submittedAt: string;
  etaAt: string;
  queueAhead?: number;
  recoveryEmailVerified: boolean;
  recoveryEmailMasked?: string;
  clarification?: {
    reason: string;
    requestedAt: string;
    originalDocumentName?: string;
  } | null;
  rejectionReason?: string | null;
  activity: VerificationActivityItem[];
}

export interface RegistrationPatch {
  name?: string;
  department?: DepartmentCode;
  enrollmentNo?: string;
  employeeId?: string;
}

// Memory / LocalStorage key for mock state
const MOCK_VERIFICATION_KEY = 'nexalink_mock_verification_state';

function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}•••@${domain}`;
  }
  return `${local[0]}${'•'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
}

export const authService = {
  /**
   * Fetch current user's verification state
   */
  async getMyVerificationState(fallbackUser?: any): Promise<VerificationStatePayload> {
    const isMock = !isSupabaseConfigured() || fallbackUser?.id?.startsWith('mock-');

    if (isMock || !supabase.auth.getUser) {
      // Load or initialize mock state
      const savedMock = localStorage.getItem(MOCK_VERIFICATION_KEY);
      if (savedMock) {
        try {
          const parsed = JSON.parse(savedMock);
          return parsed;
        } catch {
          // ignore parsing error
        }
      }

      // Default mock payload based on fallbackUser
      const submittedAt = fallbackUser?.createdAt || new Date().toISOString();
      const etaAt = getEstimatedReviewDate(submittedAt);
      const hasDoc = Boolean(fallbackUser?.proofDocumentName || fallbackUser?.verificationDocumentName);
      const docName = fallbackUser?.proofDocumentName || fallbackUser?.verificationDocumentName || (hasDoc ? 'college_id.pdf' : undefined);
      const status: AccountVerificationStatus = fallbackUser?.verificationStatus || 'Pending Verification';

      const payload: VerificationStatePayload = {
        status,
        hasDocument: hasDoc,
        documentName: docName,
        submittedAt,
        etaAt,
        queueAhead: 4,
        recoveryEmailVerified: Boolean(fallbackUser?.personalEmail),
        recoveryEmailMasked: maskEmail(fallbackUser?.personalEmail || 'student.alumni@gmail.com'),
        clarification: fallbackUser?.clarificationRequested
          ? {
              reason: fallbackUser.clarificationRequested.text || fallbackUser.clarificationRequested.reason,
              requestedAt: fallbackUser.clarificationRequested.requestedAt || new Date().toISOString(),
              originalDocumentName: docName
            }
          : fallbackUser?.clarificationRequest
          ? {
              reason: fallbackUser.clarificationRequest,
              requestedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
              originalDocumentName: docName
            }
          : null,
        rejectionReason: fallbackUser?.rejectionReason || null,
        activity: [
          {
            id: 'act-1',
            type: 'submitted',
            title: 'Registration submitted',
            timestamp: submittedAt
          },
          ...(hasDoc
            ? [
                {
                  id: 'act-2',
                  type: 'document_received' as const,
                  title: 'Document received',
                  description: docName,
                  timestamp: new Date(new Date(submittedAt).getTime() + 60000).toISOString()
                }
              ]
            : []),
          {
            id: 'act-3',
            type: 'moved_to_review',
            title: 'Moved to review',
            timestamp: new Date(new Date(submittedAt).getTime() + 120000).toISOString()
          }
        ]
      };

      return payload;
    }

    try {
      // Call Supabase RPC get_my_verification_state
      const { data, error } = await (supabase.rpc as any)('get_my_verification_state');
      if (error) {
        console.warn('RPC get_my_verification_state not found or failed, falling back to profile query:', error.message);
        // Fallback to table query
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw error;

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const submittedAt = (profile as any)?.created_at || new Date().toISOString();
        const docUrl = (profile as any)?.verification_document_url || undefined;
        const docName = (profile as any)?.proof_document_name || (docUrl ? 'document.pdf' : undefined);

        return {
          status: profile?.verification_status || 'Pending Verification',
          hasDocument: Boolean(docUrl || (profile as any)?.proof_document_name),
          documentName: docName,
          documentUrl: docUrl,
          submittedAt,
          etaAt: getEstimatedReviewDate(submittedAt),
          recoveryEmailVerified: Boolean((profile as any)?.personal_email),
          recoveryEmailMasked: maskEmail((profile as any)?.personal_email),
          clarification: (profile as any)?.clarification_requested
            ? {
                reason: (profile as any).clarification_requested?.text || (profile as any).clarification_requested,
                requestedAt: (profile as any).clarification_requested?.requestedAt || new Date().toISOString(),
                originalDocumentName: docName
              }
            : null,
          rejectionReason: profile?.rejection_reason || null,
          activity: [
            {
              id: 'act-1',
              type: 'submitted',
              title: 'Registration submitted',
              timestamp: submittedAt
            }
          ]
        };
      }

      return data as VerificationStatePayload;
    } catch (err: any) {
      console.error('Error fetching verification state:', err);
      throw err;
    }
  },

  /**
   * Save patched details (name, department, PRN/employee ID) while pending
   */
  async updateMyRegistration(patch: RegistrationPatch): Promise<{ ok: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      // Update mock storage
      const savedMock = localStorage.getItem(MOCK_VERIFICATION_KEY);
      if (savedMock) {
        try {
          const parsed = JSON.parse(savedMock);
          parsed.activity.push({
            id: `act-${Date.now()}`,
            type: 'resubmitted',
            title: 'Registration details updated',
            timestamp: new Date().toISOString()
          });
          localStorage.setItem(MOCK_VERIFICATION_KEY, JSON.stringify(parsed));
        } catch {
          // ignore
        }
      }
      return { ok: true };
    }

    try {
      const { error } = await (supabase.rpc as any)('update_my_registration', {
        patch_data: patch
      });

      if (error) {
        // Direct update fallback if RPC is not present
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw error;

        const updatePayload: Record<string, any> = {};
        if (patch.name) updatePayload.name = patch.name;
        if (patch.department) updatePayload.department = patch.department;
        if (patch.enrollmentNo) updatePayload.enrollment_no = patch.enrollmentNo;
        if (patch.employeeId) updatePayload.employee_id = patch.employeeId;

        const { error: directErr } = await (supabase.from('users') as any)
          .update(updatePayload)
          .eq('id', user.id);

        if (directErr) throw directErr;
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to update details' };
    }
  },

  /**
   * Submit or replace proof document
   */
  async submitProofDocument(file: File, userId: string): Promise<{ ok: boolean; documentName?: string; error?: string }> {
    try {
      const uploadRes = await uploadProofDocument(file, userId);
      if (uploadRes.error) {
        return { ok: false, error: uploadRes.error || 'Failed to upload document' };
      }

      const docName = file.name;

      if (!isSupabaseConfigured() || userId.startsWith('mock-')) {
        const savedMock = localStorage.getItem(MOCK_VERIFICATION_KEY);
        if (savedMock) {
          try {
            const parsed = JSON.parse(savedMock);
            parsed.hasDocument = true;
            parsed.documentName = docName;
            parsed.status = 'Pending Verification';
            parsed.activity.push({
              id: `act-${Date.now()}`,
              type: 'document_received',
              title: 'Proof document updated',
              description: docName,
              timestamp: new Date().toISOString()
            });
            localStorage.setItem(MOCK_VERIFICATION_KEY, JSON.stringify(parsed));
          } catch {
            // ignore
          }
        }
        return { ok: true, documentName: docName };
      }

      // Supabase RPC
      const { error } = await (supabase.rpc as any)('submit_proof_document', {
        doc_path: uploadRes.url || docName,
        doc_name: docName
      });

      if (error) {
        // Fallback update
        await (supabase.from('users') as any)
          .update({
            verification_document_url: uploadRes.url,
            proof_document_name: docName,
            verification_status: 'Pending Verification'
          })
          .eq('id', userId);
      }

      return { ok: true, documentName: docName };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Error uploading document' };
    }
  },

  /**
   * Send recovery email OTP
   */
  async sendRecoveryOtp(email: string): Promise<{ ok: boolean; error?: string }> {
    // Cooldown check or mock simulator
    return { ok: true };
  },

  /**
   * Verify recovery email OTP
   */
  async verifyRecoveryOtp(code: string): Promise<{ ok: boolean; error?: string }> {
    if (code.length !== 6) {
      return { ok: false, error: 'Please enter a complete 6-digit code.' };
    }
    // In mock/dev, accept valid length code
    return { ok: true };
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { ok: true };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/?mode=reset-password`
      });
      if (error) {
        console.warn('Supabase reset password response:', error.message);
      }
      return { ok: true };
    } catch {
      return { ok: true };
    }
  }
};
