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
  userReplied?: boolean;
  userRepliedAt?: string;
  clarification?: {
    reason: string;
    documentType?: string;
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

      const clarRaw = fallbackUser?.clarificationRequested || fallbackUser?.clarificationRequest;
      const clarReason = typeof clarRaw === 'object' ? (clarRaw.reason || clarRaw.text) : (typeof clarRaw === 'string' ? clarRaw : null);
      const clarDocType = typeof clarRaw === 'object' ? clarRaw.documentType : 'College ID';
      const clarTime = typeof clarRaw === 'object' ? (clarRaw.requestedAt || new Date().toISOString()) : new Date(Date.now() - 3600000 * 4).toISOString();

      const userReplied = Boolean(fallbackUser?.userReplied || fallbackUser?.user_replied);
      const userRepliedAt = fallbackUser?.userRepliedAt || fallbackUser?.user_replied_at;

      const activityItems: VerificationActivityItem[] = [
        {
          id: 'act-1',
          type: 'submitted',
          title: 'Registration submitted',
          timestamp: submittedAt
        }
      ];

      if (clarReason) {
        activityItems.push({
          id: 'act-clarification',
          type: 'clarification_requested',
          title: 'Administrator requested a document',
          description: `${clarReason}${clarDocType ? ` (${clarDocType})` : ''}`,
          timestamp: clarTime
        });
      }

      if (userReplied && docName) {
        activityItems.push({
          id: 'act-user-upload',
          type: 'document_received',
          title: `You uploaded ${docName}`,
          description: docName,
          timestamp: userRepliedAt || new Date().toISOString()
        });
      } else if (hasDoc) {
        activityItems.push({
          id: 'act-2',
          type: 'document_received',
          title: 'Document received',
          description: docName,
          timestamp: new Date(new Date(submittedAt).getTime() + 60000).toISOString()
        });
      }

      activityItems.push({
        id: 'act-3',
        type: 'moved_to_review',
        title: 'Moved to review',
        timestamp: new Date(new Date(submittedAt).getTime() + 120000).toISOString()
      });

      const payload: VerificationStatePayload = {
        status,
        hasDocument: hasDoc,
        documentName: docName,
        submittedAt,
        etaAt,
        queueAhead: 4,
        recoveryEmailVerified: Boolean(fallbackUser?.email_confirmed_at || fallbackUser?.emailConfirmedAt || fallbackUser?.personalEmailVerified || fallbackUser?.personalEmail),
        recoveryEmailMasked: maskEmail(fallbackUser?.personalEmail || 'student.alumni@gmail.com'),
        userReplied,
        userRepliedAt,
        clarification: clarReason
          ? {
              reason: clarReason,
              documentType: clarDocType,
              requestedAt: clarTime,
              originalDocumentName: docName
            }
          : null,
        rejectionReason: fallbackUser?.rejectionReason || null,
        activity: activityItems
      };

      return payload;
    }

    try {
      // Query Supabase Auth user to get genuine email_confirmed_at
      const { data: { user } } = await supabase.auth.getUser();
      const isEmailConfirmed = Boolean(user?.email_confirmed_at);

      // Call Supabase RPC get_my_verification_state
      const { data, error } = await (supabase.rpc as any)('get_my_verification_state');
      if (error) {
        if (!user) throw error;

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const submittedAt = (profile as any)?.created_at || new Date().toISOString();
        const docUrl = (profile as any)?.verification_document_url || undefined;
        const docName = (profile as any)?.proof_document_name || (docUrl ? 'document.pdf' : undefined);
        const clarRaw = (profile as any)?.clarification_requested;
        const clarReason = clarRaw?.reason || clarRaw?.text || (typeof clarRaw === 'string' ? clarRaw : null);
        const clarDocType = clarRaw?.documentType || 'College ID';
        const clarTime = clarRaw?.requestedAt || (profile as any)?.updated_at || submittedAt;

        const userReplied = Boolean((profile as any)?.user_replied);
        const userRepliedAt = (profile as any)?.user_replied_at || undefined;

        const activityItems: VerificationActivityItem[] = [
          {
            id: 'act-1',
            type: 'submitted',
            title: 'Registration submitted',
            timestamp: submittedAt
          }
        ];

        if (clarReason) {
          activityItems.push({
            id: 'act-clarification',
            type: 'clarification_requested',
            title: 'Administrator requested a document',
            description: `${clarReason}${clarDocType ? ` (${clarDocType})` : ''}`,
            timestamp: clarTime
          });
        }

        if (userReplied && docName) {
          activityItems.push({
            id: 'act-user-upload',
            type: 'document_received',
            title: `You uploaded ${docName}`,
            description: docName,
            timestamp: userRepliedAt || new Date().toISOString()
          });
        } else if (docUrl) {
          activityItems.push({
            id: 'act-doc',
            type: 'document_received',
            title: 'Document received',
            description: docName,
            timestamp: submittedAt
          });
        }

        activityItems.push({
          id: 'act-review',
          type: 'moved_to_review',
          title: 'Moved to review',
          timestamp: submittedAt
        });

        return {
          status: profile?.verification_status || 'Pending Verification',
          hasDocument: Boolean(docUrl || (profile as any)?.proof_document_name),
          documentName: docName,
          documentUrl: docUrl,
          submittedAt,
          etaAt: getEstimatedReviewDate(submittedAt),
          recoveryEmailVerified: isEmailConfirmed,
          recoveryEmailMasked: maskEmail((profile as any)?.personal_email || (profile as any)?.email),
          userReplied,
          userRepliedAt,
          clarification: clarReason
            ? {
                reason: clarReason,
                documentType: clarDocType,
                requestedAt: clarTime,
                originalDocumentName: docName
              }
            : null,
          rejectionReason: profile?.rejection_reason || null,
          activity: activityItems
        };
      }

      // If RPC succeeded, ensure recoveryEmailVerified is populated from auth user
      const rpcPayload = data as VerificationStatePayload;
      if (user) {
        rpcPayload.recoveryEmailVerified = isEmailConfirmed;
      }
      return rpcPayload;
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
  async submitProofDocument(file: File, userId: string): Promise<{ ok: boolean; documentName?: string; url?: string; path?: string; error?: string }> {
    try {
      const uploadRes = await uploadProofDocument(file, userId);
      if (uploadRes.error) {
        return { ok: false, error: uploadRes.error || 'Failed to upload document' };
      }

      const docName = file.name;
      const docPath = uploadRes.path || uploadRes.url || docName;
      const docUrl = uploadRes.url || docPath;
      const nowIso = new Date().toISOString();

      const isMock = !isSupabaseConfigured() || userId.startsWith('mock-') || userId.startsWith('user-');

      // Persist across browser tabs & sessions via localStorage and custom event
      try {
        if (typeof window !== 'undefined') {
          // 1. Last user reply record for instantaneous cross-tab syncing
          const replyMeta = {
            userId,
            documentName: docName,
            documentUrl: docUrl,
            timestamp: nowIso
          };
          localStorage.setItem('nexalink_last_user_reply', JSON.stringify(replyMeta));

          // 2. Update nexalink_auth_user if present
          const authUserStr = localStorage.getItem('nexalink_auth_user');
          if (authUserStr) {
            try {
              const authUser = JSON.parse(authUserStr);
              if (authUser.id === userId || !userId || userId === 'mock-unverified-student') {
                authUser.verificationDocumentUrl = docUrl;
                authUser.proofDocumentName = docName;
                authUser.verificationStatus = 'Pending Verification';
                authUser.userReplied = true;
                authUser.userRepliedAt = nowIso;
                localStorage.setItem('nexalink_auth_user', JSON.stringify(authUser));
              }
            } catch {}
          }

          // 3. Update nexalink_users_registry if present
          const regStr = localStorage.getItem('nexalink_users_registry');
          if (regStr) {
            try {
              const reg = JSON.parse(regStr);
              if (Array.isArray(reg)) {
                const updatedReg = reg.map((u: any) =>
                  u.id === userId
                    ? {
                        ...u,
                        verificationDocumentUrl: docUrl,
                        proofDocumentName: docName,
                        verificationStatus: 'Pending Verification',
                        userReplied: true,
                        userRepliedAt: nowIso
                      }
                    : u
                );
                localStorage.setItem('nexalink_users_registry', JSON.stringify(updatedReg));
              }
            } catch {}
          }

          // 4. Update mock verification key
          const savedMock = localStorage.getItem(MOCK_VERIFICATION_KEY);
          if (savedMock) {
            try {
              const parsed = JSON.parse(savedMock);
              parsed.hasDocument = true;
              parsed.documentName = docName;
              parsed.documentUrl = docUrl;
              parsed.status = 'Pending Verification';
              parsed.userReplied = true;
              parsed.userRepliedAt = nowIso;
              parsed.activity.push({
                id: `act-${Date.now()}`,
                type: 'document_received',
                title: `You uploaded ${docName}`,
                description: docName,
                timestamp: nowIso
              });
              localStorage.setItem(MOCK_VERIFICATION_KEY, JSON.stringify(parsed));
            } catch {}
          }

          // Broadcast to all active tabs
          window.dispatchEvent(new CustomEvent('nexalink_user_replied', { detail: replyMeta }));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {
        console.warn('[authService] localStorage sync failed:', e);
      }

      if (isMock) {
        return { ok: true, documentName: docName, url: docUrl, path: uploadRes.path };
      }

      // Supabase authenticated mode
      const { data: authData } = await supabase.auth.getUser();
      const actualUid = authData?.user?.id || userId;

      // Try Security Definer RPC: resubmit_verification(doc_path, doc_name)
      const { error: rpcError } = await (supabase.rpc as any)('resubmit_verification', {
        doc_path: docPath,
        doc_name: docName
      });

      if (rpcError) {
        console.warn('resubmit_verification RPC failed or not installed, falling back to direct update:', rpcError.message);
        
        // Attempt direct update with clarification_requested object containing reply details
        const clarPayload = {
          userReplied: true,
          user_replied: true,
          userRepliedAt: nowIso,
          documentName: docName,
          documentUrl: docUrl
        };

        const { error: directErr } = await (supabase.from('users') as any)
          .update({
            verification_document_url: docUrl,
            proof_document_name: docName,
            verification_status: 'Pending Verification',
            user_replied: true,
            user_replied_at: nowIso,
            clarification_requested: clarPayload
          })
          .eq('id', actualUid);

        if (directErr) {
          console.warn('Direct update with user_replied columns failed, updating core fields only:', directErr.message);
          // If user_replied column does not exist yet in unmigrated database, update without it
          const { error: fallbackErr } = await (supabase.from('users') as any)
            .update({
              verification_document_url: docUrl,
              proof_document_name: docName,
              verification_status: 'Pending Verification',
              clarification_requested: clarPayload
            })
            .eq('id', actualUid);

          if (fallbackErr) {
            console.warn('Fallback update failed, attempting document columns only:', fallbackErr.message);
            // Minimum update that still preserves the document for the admin to inspect
            await (supabase.from('users') as any)
              .update({
                verification_document_url: docUrl,
                proof_document_name: docName
              })
              .eq('id', actualUid);
          }
        }
      }

      return { ok: true, documentName: docName, url: docUrl, path: uploadRes.path };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Error uploading document' };
    }
  },

  /**
   * Initiate user signup in Supabase Auth (Rule 1 & Rule 3)
   * Sends confirmation email OTP via Supabase SMTP
   */
  async initiateSignUp(userData: {
    email: string;
    password: string;
    name: string;
    role: string;
    department?: string;
    enrollmentNo?: string;
  }): Promise<{ ok: boolean; status?: 'needs_verification' | 'already_confirmed'; user?: any; error?: string }> {
    const targetEmail = (userData.email || '').replace(/^\+/, '').trim().toLowerCase();
    const isMock = import.meta.env.DEV && import.meta.env.VITE_DATA_MODE === 'mock';

    if (!isMock && isSupabaseConfigured()) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: targetEmail,
          password: userData.password,
          options: {
            data: {
              name: userData.name,
              role: userData.role,
              department: userData.department || 'CMPN'
            }
          }
        });

        if (authError) {
          const errorMsg = authError.message.toLowerCase();
          if (errorMsg.includes('already registered')) {
            // Self-healing for already registered user (Rule 4):
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: targetEmail,
              password: userData.password
            });

            if (signInError) {
              const signErrorMsg = signInError.message.toLowerCase();
              if (signErrorMsg.includes('email not confirmed')) {
                // Account created earlier but email unconfirmed -> resend signup OTP
                const { error: resendErr } = await supabase.auth.resend({
                  type: 'signup',
                  email: targetEmail
                });
                if (resendErr) {
                  return { ok: false, error: resendErr.message };
                }
                return { ok: true, status: 'needs_verification' };
              }
              if (signErrorMsg.includes('invalid login credentials')) {
                return {
                  ok: false,
                  error: 'An account with this email already exists with a different password. Please sign in or reset your password.'
                };
              }
              return { ok: false, error: signInError.message };
            }

            if (signInData?.user) {
              // Check if public profile exists
              const { data: existingProfile } = await supabase
                .from('users')
                .select('id')
                .eq('id', signInData.user.id)
                .maybeSingle();

              if (existingProfile) {
                await supabase.auth.signOut();
                return {
                  ok: false,
                  error: 'This email is already registered. Please sign in instead.'
                };
              }

              // Orphaned confirmed account -> proceed directly
              return { ok: true, status: 'already_confirmed', user: signInData.user };
            }
          }
          return { ok: false, error: authError.message };
        }

        return { ok: true, status: 'needs_verification', user: authData?.user };
      } catch (err: any) {
        return { ok: false, error: err.message || 'Registration failed.' };
      }
    }

    if (isMock) {
      return { ok: true, status: 'needs_verification' };
    }

    return { ok: false, error: 'Authentication service unavailable.' };
  },

  /**
   * Verify signup email OTP via Supabase (Rule 1 & Rule 3)
   */
  async verifySignupOtp(email: string, code: string): Promise<{ ok: boolean; user?: any; session?: any; error?: string }> {
    const targetEmail = (email || '').replace(/^\+/, '').trim().toLowerCase();
    const token = (code || '').trim();

    if (!token || token.length !== 6) {
      return { ok: false, error: 'Please enter the complete 6-digit code.' };
    }

    const isMock = import.meta.env.DEV && import.meta.env.VITE_DATA_MODE === 'mock';

    if (!isMock && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: targetEmail,
          token,
          type: 'signup'
        });

        if (error) {
          const lower = (error.message || '').toLowerCase();
          let errorMsg: string;
          if (lower.includes('invalid') || lower.includes('token has expired or is invalid') || lower.includes('is invalid or has expired')) {
            errorMsg = 'Incorrect verification code. Please check the 6-digit code and try again.';
          } else if (lower.includes('expired')) {
            errorMsg = 'This verification code has expired. Please request a new code.';
          } else {
            errorMsg = error.message || 'Incorrect verification code. Please check the code in your email.';
          }
          return { ok: false, error: errorMsg };
        }

        if (!data.user) {
          return { ok: false, error: 'Verification failed. Please try again.' };
        }

        return { ok: true, user: data.user, session: data.session };
      } catch (err: any) {
        return { ok: false, error: err.message || 'Verification failed.' };
      }
    }

    if (isMock) {
      if (token === '123456') {
        return { ok: true };
      }
      return { ok: false, error: 'Incorrect verification code. (Demo code: 123456)' };
    }

    return { ok: false, error: 'Authentication service unavailable.' };
  },

  /**
   * Resend signup email OTP via Supabase (Rule 1)
   */
  async resendSignupOtp(email: string): Promise<{ ok: boolean; error?: string }> {
    const targetEmail = (email || '').replace(/^\+/, '').trim().toLowerCase();
    const isMock = import.meta.env.DEV && import.meta.env.VITE_DATA_MODE === 'mock';

    if (!isMock && isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: targetEmail
        });
        if (error) {
          return { ok: false, error: error.message };
        }
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err.message || 'Failed to resend code.' };
      }
    }

    if (isMock) {
      return { ok: true };
    }

    return { ok: false, error: 'Authentication service unavailable.' };
  },

  /**
   * Request password reset email via Supabase (Rule 1)
   */
  async requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
    const targetEmail = (email || '').replace(/^\+/, '').trim().toLowerCase();
    const isMock = import.meta.env.DEV && import.meta.env.VITE_DATA_MODE === 'mock';

    if (typeof window !== 'undefined' && targetEmail) {
      sessionStorage.setItem('nexalink_active_recovery_email', targetEmail);
    }

    if (!isMock && isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) {
          const lower = (error.message || '').toLowerCase();
          if (lower.includes('smtp') || lower.includes('mail') || lower.includes('rate limit')) {
            return { ok: false, error: 'We could not send the code. Try again later' };
          }
          return { ok: false, error: error.message || 'We could not send the code. Try again later' };
        }
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err.message || 'We could not send the code. Try again later' };
      }
    }

    if (isMock) {
      return { ok: true };
    }

    return { ok: false, error: 'We could not send the code. Try again later' };
  },

  /**
   * Send recovery email OTP (alias for requestPasswordReset)
   */
  async sendRecoveryOtp(email: string): Promise<{ ok: boolean; error?: string }> {
    return this.requestPasswordReset(email);
  },

  /**
   * Verify password reset recovery OTP via Supabase (Rule 1 & Rule 2)
   */
  async verifyRecoveryOtp(email: string, code: string): Promise<{ ok: boolean; user?: any; session?: any; error?: string }> {
    const targetEmail = (email || '').replace(/^\+/, '').trim().toLowerCase();
    const token = (code || '').trim();

    if (!token || token.length !== 6) {
      return { ok: false, error: 'Please enter the complete 6-digit code.' };
    }

    if (typeof window !== 'undefined' && targetEmail) {
      sessionStorage.setItem('nexalink_active_recovery_email', targetEmail);
    }

    const isMock = import.meta.env.DEV && import.meta.env.VITE_DATA_MODE === 'mock';

    if (!isMock && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: targetEmail,
          token,
          type: 'recovery'
        });

        if (error) {
          const lower = (error.message || '').toLowerCase();
          let errorMsg: string;
          if (lower.includes('invalid') || lower.includes('token has expired or is invalid') || lower.includes('is invalid or has expired')) {
            errorMsg = 'Incorrect recovery code. Please check the 6-digit code and try again.';
          } else if (lower.includes('expired')) {
            errorMsg = 'This recovery code has expired. Please request a new code.';
          } else {
            errorMsg = error.message || 'Incorrect recovery code. Please check the code in your email.';
          }
          return { ok: false, error: errorMsg };
        }

        return { ok: true, user: data.user, session: data.session };
      } catch (err: any) {
        return { ok: false, error: err.message || 'Recovery verification failed.' };
      }
    }

    if (isMock) {
      if (token === '482910') {
        return { ok: true };
      }
      return { ok: false, error: 'Incorrect recovery code. (Demo code: 482910)' };
    }

    return { ok: false, error: 'Authentication service unavailable.' };
  },

  /**
   * Resend password reset recovery email / OTP via Supabase (Rule 1)
   */
  async resendRecoveryOtp(email: string): Promise<{ ok: boolean; error?: string }> {
    return this.requestPasswordReset(email);
  },

  /**
   * Update password in Supabase Auth (Rule 1)
   */
  async updatePassword(newPassword: string): Promise<{ ok: boolean; user?: any; error?: string }> {
    const isMock = import.meta.env.DEV && import.meta.env.VITE_DATA_MODE === 'mock';
    const targetEmail = typeof window !== 'undefined' ? sessionStorage.getItem('nexalink_active_recovery_email') : null;

    if (!isMock && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (error) {
          const lower = (error.message || '').toLowerCase();
          let userMsg = error.message;
          if (lower.includes('same password') || lower.includes('different from old')) {
            userMsg = 'New password cannot be the same as your old password.';
          } else if (lower.includes('weak') || lower.includes('at least')) {
            userMsg = 'Password is too weak. Please choose a stronger password with at least 10 characters.';
          } else if (lower.includes('session') || lower.includes('expired') || lower.includes('jwt')) {
            userMsg = 'Your recovery session has expired. Please request a new code.';
          } else if (lower.includes('network') || lower.includes('fetch')) {
            userMsg = 'Network connection error. Please check your internet connection and retry.';
          }
          return { ok: false, error: userMsg };
        }

        // Sign out recovery session so user logs in fresh
        await supabase.auth.signOut().catch(() => {});

        // Clear server lockout if email known
        if (targetEmail) {
          try {
            await supabase.from('login_attempts').delete().eq('email', targetEmail);
          } catch {}
          try {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(`nexalink_lockout_${targetEmail}`);
            }
          } catch {}
        }

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('nexalink_signin_notice', 'Sign in with your new password');
          sessionStorage.removeItem('nexalink_active_recovery_email');
        }

        return { ok: true, user: data?.user };
      } catch (err: any) {
        return { ok: false, error: err.message || 'Failed to update password.' };
      }
    }

    if (isMock) {
      try {
        if (typeof window !== 'undefined') {
          // 1. Update mock credentials store
          const credsStr = localStorage.getItem('nexalink_mock_credentials');
          let creds: Record<string, string> = {};
          if (credsStr) {
            try { creds = JSON.parse(credsStr); } catch {}
          }
          if (targetEmail) {
            creds[targetEmail] = newPassword;
            localStorage.setItem('nexalink_mock_credentials', JSON.stringify(creds));
          }

          // 2. Update nexalink_users_registry
          const regStr = localStorage.getItem('nexalink_users_registry');
          if (regStr) {
            try {
              const reg = JSON.parse(regStr);
              if (Array.isArray(reg)) {
                const updated = reg.map((u: any) => {
                  if (
                    targetEmail &&
                    (u.email?.toLowerCase() === targetEmail ||
                     u.personalEmail?.toLowerCase() === targetEmail ||
                     u.institutionalEmail?.toLowerCase() === targetEmail)
                  ) {
                    return { ...u, password: newPassword };
                  }
                  return u;
                });
                localStorage.setItem('nexalink_users_registry', JSON.stringify(updated));
              }
            } catch {}
          }

          // 3. Update nexalink_auth_user if matches
          const authUserStr = localStorage.getItem('nexalink_auth_user');
          if (authUserStr) {
            try {
              const au = JSON.parse(authUserStr);
              if (
                targetEmail &&
                (au.email?.toLowerCase() === targetEmail ||
                 au.personalEmail?.toLowerCase() === targetEmail ||
                 au.institutionalEmail?.toLowerCase() === targetEmail)
              ) {
                au.password = newPassword;
                localStorage.setItem('nexalink_auth_user', JSON.stringify(au));
              }
            } catch {}
          }

          // 4. Clear any local lockout
          if (targetEmail) {
            localStorage.removeItem(`nexalink_lockout_${targetEmail}`);
          }
          sessionStorage.setItem('nexalink_signin_notice', 'Sign in with your new password');
          sessionStorage.removeItem('nexalink_active_recovery_email');
        }
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err.message || 'Failed to update mock password.' };
      }
    }

    return { ok: false, error: 'Authentication service unavailable.' };
  }
};
