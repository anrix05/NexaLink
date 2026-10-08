import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AdminInviteVerification {
  status: 'valid' | 'expired' | 'used' | 'revoked' | 'not_found';
  invitedEmail?: string;
  expiresAt?: string;
}

export interface CreateAdminInviteResult {
  success: boolean;
  error?: string;
  rawToken?: string;
  inviteLink?: string;
}

export interface AcceptAdminInviteResult {
  success: boolean;
  error?: string;
  message?: string;
}

const MOCK_STORAGE_KEY = 'nexalink_mock_admin_invites';

interface MockStoredInvite {
  token: string;
  email: string;
  status: 'valid' | 'expired' | 'used' | 'revoked';
  expiresAt: string;
}

function getMockInvites(): Record<string, MockStoredInvite> {
  try {
    const raw = sessionStorage.getItem(MOCK_STORAGE_KEY) || localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveMockInvite(invite: MockStoredInvite) {
  try {
    const map = getMockInvites();
    map[invite.token] = invite;
    sessionStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(map));
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export const adminInviteService = {
  /**
   * Create an admin invite and get raw token
   */
  async createAdminInvite(email: string): Promise<CreateAdminInviteResult> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.rpc as any)('create_admin_invite', {
          p_email: cleanEmail
        });

        if (error) {
          return { success: false, error: error.message || 'Failed to create admin invitation.' };
        }

        const rawToken = data as string;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const inviteLink = `${origin}/?tab=admin-invite&token=${encodeURIComponent(rawToken)}`;

        return {
          success: true,
          rawToken,
          inviteLink
        };
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error creating invitation.' };
      }
    }

    // Mock / Offline DEV mode fallback
    if (import.meta.env.DEV) {
      const mockToken = `mock-adm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
      saveMockInvite({
        token: mockToken,
        email: cleanEmail,
        status: 'valid',
        expiresAt
      });
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const inviteLink = `${origin}/?tab=admin-invite&token=${encodeURIComponent(mockToken)}`;
      return {
        success: true,
        rawToken: mockToken,
        inviteLink
      };
    }

    return { success: false, error: 'Database unconfigured.' };
  },

  /**
   * Verify an admin invite token (publicly accessible)
   */
  async getAdminInvite(token: string): Promise<AdminInviteVerification> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return { status: 'not_found' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.rpc as any)('get_admin_invite', {
          p_token: cleanToken
        });

        if (error || !data) {
          return { status: 'not_found' };
        }

        return {
          status: data.status || 'not_found',
          invitedEmail: data.invited_email || undefined,
          expiresAt: data.expires_at || undefined
        };
      } catch {
        return { status: 'not_found' };
      }
    }

    // Mock / Offline DEV mode fallback
    if (import.meta.env.DEV && cleanToken.startsWith('mock-')) {
      const mockInvites = getMockInvites();
      const match = mockInvites[cleanToken];
      if (match) {
        if (new Date(match.expiresAt).getTime() <= Date.now()) {
          return { status: 'expired', invitedEmail: match.email, expiresAt: match.expiresAt };
        }
        return { status: match.status, invitedEmail: match.email, expiresAt: match.expiresAt };
      }
      // Demo default token
      if (cleanToken === 'mock-admin-token') {
        return {
          status: 'valid',
          invitedEmail: 'pbclubyt@gmail.com',
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString()
        };
      }
    }

    return { status: 'not_found' };
  },

  /**
   * Accept an admin invite (authenticated caller)
   */
  async acceptAdminInvite(token: string, name: string): Promise<AcceptAdminInviteResult> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return { success: false, error: 'Missing invitation token.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.rpc as any)('accept_admin_invite', {
          p_token: cleanToken,
          p_name: name.trim()
        });

        if (error) {
          return { success: false, error: error.message || 'Failed to activate admin privileges.' };
        }

        return {
          success: Boolean(data?.success),
          message: data?.message || 'Administrator privileges activated successfully.'
        };
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to communicate with activation endpoint.' };
      }
    }

    // Mock / Offline DEV mode
    if (import.meta.env.DEV && cleanToken.startsWith('mock-')) {
      const mockInvites = getMockInvites();
      if (mockInvites[cleanToken]) {
        mockInvites[cleanToken].status = 'used';
        sessionStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockInvites));
      }
      return { success: true, message: 'Admin account activated in development mode.' };
    }

    return { success: false, error: 'Database unconfigured.' };
  },

  /**
   * Revoke an admin invite
   */
  async revokeAdminInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
    if (!inviteId) return { success: false, error: 'Missing invite ID.' };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await (supabase.rpc as any)('revoke_admin_invite', {
          p_invite_id: inviteId
        });
        if (error) {
          return { success: false, error: error.message || 'Failed to revoke invite.' };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error revoking invite.' };
      }
    }

    return { success: true };
  }
};
