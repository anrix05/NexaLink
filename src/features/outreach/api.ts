// ============================================================================
// NEXALINK V2.8: Outreach API Client (Supabase RPC with DEV mock fallback)
// ============================================================================

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type {
  StudentOutreachSettings,
  DiscoverableStudent,
  SuggestedStudent,
  OutreachInvitation,
  ProfileViewItem,
  DiscoverStudentsFilter,
  SendInvitationResult
} from './types';

function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function shouldUseMock(userId?: string): boolean {
  if (!isSupabaseConfigured()) return true;
  if (!userId || !isValidUuid(userId)) return true;
  return false;
}

// Dynamic loader for mockStore to prevent bundling in production
async function getMockStore() {
  if (import.meta.env.DEV) {
    const mod = await import('./mockStore');
    return mod.mockStore;
  }
  // In production if mock is somehow invoked, provide safe stub
  return {
    getSettings: (studentId: string) => ({
      studentId,
      openToOutreach: false,
      showSkills: true,
      showCareerGoal: true,
      showInterests: true,
      updatedAt: new Date().toISOString()
    }),
    updateSettings: (studentId: string, p: Partial<StudentOutreachSettings>) => ({
      studentId,
      openToOutreach: p.openToOutreach ?? false,
      showSkills: p.showSkills ?? true,
      showCareerGoal: p.showCareerGoal ?? true,
      showInterests: p.showInterests ?? true,
      updatedAt: new Date().toISOString()
    }),
    listDiscoverable: () => ({ students: [], totalCount: 0 }),
    suggestStudents: () => [],
    sendInvitation: () => ({ success: false, remainingQuota: 0, error: 'Offline mode' }),
    respondToInvitation: () => ({ success: false, status: 'error' }),
    withdrawInvitation: () => ({ success: false }),
    getStudentInvitations: () => [],
    getSentInvitations: () => [],
    recordProfileView: () => {},
    getProfileViews: () => [],
    getStudentResumeUrl: () => ({ authorized: false, error: 'Offline mode' })
  };
}

export const outreachApi = {
  /**
   * Get student's outreach visibility settings
   */
  async getSettings(studentId: string): Promise<StudentOutreachSettings> {
    if (shouldUseMock(studentId)) {
      const store = await getMockStore();
      return store.getSettings(studentId);
    }

    try {
      const { data, error } = await supabase
        .from('student_outreach_settings' as any)
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('[outreachApi] getSettings error:', error);
      }

      if (data) {
        const row = data as any;
        return {
          studentId: row.student_id,
          openToOutreach: Boolean(row.open_to_outreach),
          showSkills: Boolean(row.show_skills),
          showCareerGoal: Boolean(row.show_career_goal),
          showInterests: Boolean(row.show_interests),
          updatedAt: row.updated_at
        };
      }

      return {
        studentId,
        openToOutreach: false,
        showSkills: true,
        showCareerGoal: true,
        showInterests: true,
        updatedAt: new Date().toISOString()
      };
    } catch {
      const store = await getMockStore();
      return store.getSettings(studentId);
    }
  },

  /**
   * Update student's outreach visibility settings
   */
  async updateSettings(studentId: string, settings: Partial<StudentOutreachSettings>): Promise<StudentOutreachSettings> {
    if (shouldUseMock(studentId)) {
      const store = await getMockStore();
      return store.updateSettings(studentId, settings);
    }

    try {
      const payload: Record<string, any> = {
        student_id: studentId,
        updated_at: new Date().toISOString()
      };
      if (settings.openToOutreach !== undefined) payload.open_to_outreach = settings.openToOutreach;
      if (settings.showSkills !== undefined) payload.show_skills = settings.showSkills;
      if (settings.showCareerGoal !== undefined) payload.show_career_goal = settings.showCareerGoal;
      if (settings.showInterests !== undefined) payload.show_interests = settings.showInterests;

      const { data, error } = await supabase
        .from('student_outreach_settings' as any)
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      const row = data as any;
      return {
        studentId: row.student_id,
        openToOutreach: Boolean(row.open_to_outreach),
        showSkills: Boolean(row.show_skills),
        showCareerGoal: Boolean(row.show_career_goal),
        showInterests: Boolean(row.show_interests),
        updatedAt: row.updated_at
      };
    } catch (e) {
      console.warn('[outreachApi] updateSettings fallback to mock:', e);
      const store = await getMockStore();
      return store.updateSettings(studentId, settings);
    }
  },

  /**
   * List discoverable students with server-side masking & pagination
   */
  async listDiscoverable(
    viewerId: string,
    viewerRole: string,
    viewerDept: string,
    filters: DiscoverStudentsFilter & { limit?: number; offset?: number } = {}
  ): Promise<{ students: DiscoverableStudent[]; totalCount: number }> {
    if (shouldUseMock(viewerId)) {
      const store = await getMockStore();
      return store.listDiscoverable(viewerRole, viewerDept, filters);
    }

    try {
      const { data, error } = await (supabase as any).rpc('list_discoverable_students', {
        p_query: filters.query || null,
        p_department: filters.department && filters.department !== 'All' ? filters.department : null,
        p_year: filters.year || null,
        p_skill: filters.skill || null,
        p_limit: filters.limit || 24,
        p_offset: filters.offset || 0
      });

      if (error) throw error;

      const rows = (data as any[]) || [];
      const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;

      const students: DiscoverableStudent[] = rows.map(r => ({
        id: r.id,
        name: r.name,
        department: r.department,
        currentYear: r.current_year,
        semester: r.semester,
        skills: r.skills || [],
        careerGoal: r.career_goal || '',
        areasOfInterest: r.areas_of_interest || [],
        avatarUrl: r.avatar_url || null,
        prn: r.prn || null,
        hasResume: Boolean(r.has_resume),
        invitationStatus: r.invitation_status || null
      }));

      return { students, totalCount };
    } catch (e) {
      console.warn('[outreachApi] listDiscoverable fallback:', e);
      const store = await getMockStore();
      return store.listDiscoverable(viewerRole, viewerDept, filters);
    }
  },

  /**
   * Fetch top 3 suggested students with match reasons
   */
  async suggestStudents(viewerId: string, viewerDept: string): Promise<SuggestedStudent[]> {
    if (shouldUseMock(viewerId)) {
      const store = await getMockStore();
      return store.suggestStudents(viewerDept);
    }

    try {
      const { data, error } = await (supabase as any).rpc('suggest_students', {
        p_limit: 3
      });

      if (error) throw error;

      return ((data as any[]) || []).map(r => ({
        id: r.id,
        name: r.name,
        department: r.department,
        currentYear: r.current_year,
        semester: r.semester,
        skills: r.skills || [],
        careerGoal: r.career_goal || '',
        matchReasons: r.match_reasons || [],
        avatarUrl: r.avatar_url || null
      }));
    } catch (e) {
      console.warn('[outreachApi] suggestStudents fallback:', e);
      const store = await getMockStore();
      return store.suggestStudents(viewerDept);
    }
  },

  /**
   * Send an outreach invitation (enforces rate limit server-side)
   */
  async sendInvitation(
    senderId: string,
    studentId: string,
    reason: string
  ): Promise<SendInvitationResult> {
    if (shouldUseMock(senderId)) {
      const store = await getMockStore();
      return store.sendInvitation(senderId, studentId, reason);
    }

    try {
      const { data, error } = await (supabase as any).rpc('send_outreach_invitation', {
        p_student_id: studentId,
        p_reason: reason
      });

      if (error) {
        return {
          success: false,
          remainingQuota: 0,
          error: error.message
        };
      }

      const res = data as any;
      const invRow = res.invitation;
      return {
        success: true,
        remainingQuota: res.remaining_quota ?? 0,
        invitation: {
          id: invRow.id,
          senderId: invRow.sender_id,
          studentId: invRow.student_id,
          reason: invRow.reason,
          status: invRow.status,
          createdAt: invRow.created_at,
          expiresAt: invRow.expires_at
        }
      };
    } catch (e: any) {
      return {
        success: false,
        remainingQuota: 0,
        error: e?.message || 'Failed to send invitation.'
      };
    }
  },

  /**
   * Student responds to an invitation
   */
  async respondToInvitation(
    studentId: string,
    invitationId: string,
    action: 'accept' | 'decline' | 'block_report'
  ): Promise<{ success: boolean; status: string; error?: string }> {
    if (shouldUseMock(studentId)) {
      const store = await getMockStore();
      return store.respondToInvitation(invitationId, action);
    }

    try {
      const { data, error } = await (supabase as any).rpc('respond_to_invitation', {
        p_invitation_id: invitationId,
        p_action: action
      });

      if (error) throw error;
      const res = data as any;
      return { success: true, status: res.status };
    } catch (e: any) {
      return { success: false, status: 'error', error: e?.message || 'Failed to update invitation.' };
    }
  },

  /**
   * Sender withdraws a pending invitation
   */
  async withdrawInvitation(senderId: string, invitationId: string): Promise<{ success: boolean; error?: string }> {
    if (shouldUseMock(senderId)) {
      const store = await getMockStore();
      return store.withdrawInvitation(invitationId, senderId);
    }

    try {
      const { error } = await (supabase as any).rpc('withdraw_invitation', {
        p_invitation_id: invitationId
      });

      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to withdraw invitation.' };
    }
  },

  /**
   * Fetch invitations received by student
   */
  async getStudentInvitations(studentId: string): Promise<OutreachInvitation[]> {
    if (shouldUseMock(studentId)) {
      const store = await getMockStore();
      return store.getStudentInvitations(studentId);
    }

    try {
      const { data, error } = await supabase
        .from('outreach_invitations' as any)
        .select(`
          id,
          sender_id,
          student_id,
          reason,
          status,
          created_at,
          responded_at,
          expires_at,
          users!outreach_invitations_sender_id_fkey (
            name,
            role,
            department
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data as any[]) || []).map(r => {
        const sender = r.users || {};
        return {
          id: r.id,
          senderId: r.sender_id,
          senderName: sender.name || 'Member',
          senderRole: sender.role || 'Alumni',
          senderCompanyOrDept: sender.department || 'VIT',
          studentId: r.student_id,
          reason: r.reason,
          status: r.status,
          createdAt: r.created_at,
          respondedAt: r.responded_at,
          expiresAt: r.expires_at
        };
      });
    } catch (e) {
      console.warn('[outreachApi] getStudentInvitations fallback:', e);
      const store = await getMockStore();
      return store.getStudentInvitations(studentId);
    }
  },

  /**
   * Fetch invitations sent by caller
   */
  async getSentInvitations(senderId: string): Promise<OutreachInvitation[]> {
    if (shouldUseMock(senderId)) {
      const store = await getMockStore();
      return store.getSentInvitations(senderId);
    }

    try {
      const { data, error } = await supabase
        .from('outreach_invitations' as any)
        .select(`
          id,
          sender_id,
          student_id,
          reason,
          status,
          created_at,
          responded_at,
          expires_at,
          users!outreach_invitations_student_id_fkey (
            name,
            department
          )
        `)
        .eq('sender_id', senderId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data as any[]) || []).map(r => {
        const student = r.users || {};
        return {
          id: r.id,
          senderId: r.sender_id,
          studentId: r.student_id,
          studentName: student.name || 'Student',
          studentDepartment: student.department || 'CMPN',
          reason: r.reason,
          status: r.status,
          createdAt: r.created_at,
          respondedAt: r.responded_at,
          expiresAt: r.expires_at
        };
      });
    } catch (e) {
      console.warn('[outreachApi] getSentInvitations fallback:', e);
      const store = await getMockStore();
      return store.getSentInvitations(senderId);
    }
  },

  /**
   * Record profile view (once per viewer per student per day)
   */
  async recordProfileView(viewerId: string, studentId: string, viewerName?: string, viewerRole?: string): Promise<void> {
    if (shouldUseMock(viewerId)) {
      const store = await getMockStore();
      store.recordProfileView(viewerId, viewerName || 'Visitor', viewerRole || 'Alumni');
      return;
    }

    try {
      await (supabase as any).rpc('record_profile_view', {
        p_student_id: studentId
      });
    } catch (e) {
      console.warn('[outreachApi] recordProfileView non-blocking error:', e);
    }
  },

  /**
   * Fetch "Who viewed my profile" for the last 30 days
   */
  async getProfileViews(studentId: string): Promise<ProfileViewItem[]> {
    if (shouldUseMock(studentId)) {
      const store = await getMockStore();
      return store.getProfileViews();
    }

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('student_profile_views' as any)
        .select(`
          viewer_id,
          student_id,
          viewed_on,
          created_at,
          users!student_profile_views_viewer_id_fkey (
            name,
            role,
            department
          )
        `)
        .eq('student_id', studentId)
        .gte('viewed_on', thirtyDaysAgo)
        .order('viewed_on', { ascending: false });

      if (error) throw error;

      return ((data as any[]) || []).map(r => {
        const viewer = r.users || {};
        return {
          viewerId: r.viewer_id,
          viewerName: viewer.name || 'Verified Member',
          viewerRole: viewer.role ? `${viewer.role} (${viewer.department || 'VIT'})` : 'Alumni',
          viewedOn: r.viewed_on,
          createdAt: r.created_at
        };
      });
    } catch (e) {
      console.warn('[outreachApi] getProfileViews fallback:', e);
      const store = await getMockStore();
      return store.getProfileViews();
    }
  },

  /**
   * Get short-lived signed URL for resume (authorized only after accepted invitation or own-dept faculty)
   */
  async getStudentResumeUrl(studentId: string, senderId: string): Promise<{ authorized: boolean; signedUrl?: string; error?: string }> {
    if (shouldUseMock(senderId)) {
      const store = await getMockStore();
      const res = store.getStudentResumeUrl(studentId, senderId);
      return { authorized: res.authorized, signedUrl: ('resumeUrl' in res ? (res as any).resumeUrl : undefined), error: res.error };
    }

    try {
      const { data, error } = await (supabase as any).rpc('get_student_resume_url', {
        p_student_id: studentId
      });

      if (error) throw error;
      const res = data as any;
      if (!res.authorized) {
        return { authorized: false, error: res.error || 'Access denied.' };
      }

      const rawUrl = res.resume_url;
      // If it is a storage path, generate signed URL
      if (rawUrl && !rawUrl.startsWith('http')) {
        const { data: signedData, error: signErr } = await supabase.storage
          .from('resumes')
          .createSignedUrl(rawUrl, 600); // 10 minutes

        if (signErr) throw signErr;
        return { authorized: true, signedUrl: signedData?.signedUrl };
      }

      return { authorized: true, signedUrl: rawUrl };
    } catch (e: any) {
      return { authorized: false, error: e?.message || 'Could not retrieve resume.' };
    }
  }
};
