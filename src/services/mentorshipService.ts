import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { runQuery, runMutation } from './supabaseRunner';
import type { MentorshipRequest, DepartmentCode } from '../types';
import { normalizeDepartmentCode, normalizeMentorshipStatus } from '../utils/enumMappers';

export type MentorshipRequestStatus = 'Pending' | 'Accepted' | 'Declined' | 'Completed' | 'Expired' | 'Withdrawn';



function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function mapRowToMentorshipRequest(m: any): MentorshipRequest {
  return {
    id: m.id,
    studentId: m.student_id,
    studentName: m.student_name,
    studentEmail: m.student_email,
    studentDepartment: m.student_department,
    studentYear: m.student_year,
    studentRole: m.student_role || undefined,
    studentEnrollmentNo: m.student_enrollment_no || undefined,
    mentorId: m.mentor_id,
    mentorName: m.mentor_name,
    mentorRole: m.mentor_role,
    mentorCompanyOrDept: m.mentor_company_or_dept,
    purposeOfRequest: m.purpose_of_request,
    areaOfGuidance: m.area_of_guidance,
    topic: m.topic,
    message: m.message,
    requestedDate: m.requested_date,
    expiryDate: m.expiry_date || undefined,
    status: m.status || 'Pending',
    requestType: m.request_type || undefined,
    meetingNotes: m.meeting_notes || undefined,
    scheduledTime: m.scheduled_time || undefined,
    proposedDate: m.proposed_date || undefined,
    proposedTimeSlot: m.proposed_time_slot || undefined,
    declineReason: m.decline_reason || undefined,
    feedback: m.feedback || undefined
  };
}

export const mentorshipService = {
  /**
   * Fetch all mentorship requests ordered by requested date descending
   */
  async getMentorshipRequests(): Promise<MentorshipRequest[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const rows = await runQuery<any[]>('mentorship_requests', async () => {
      return supabase.from('mentorship_requests').select('*').order('requested_date', { ascending: false });
    });

    return (rows || []).map(mapRowToMentorshipRequest);
  },

  /**
   * Create a new mentorship request
   */
  async createRequest(
    req: Omit<MentorshipRequest, 'id' | 'requestedDate' | 'status'> & { id?: string; requestedDate?: string; status?: any }
  ): Promise<MentorshipRequest> {
    const requestId = isValidUuid(req.id)
      ? req.id!
      : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);

    const payload: any = {
      student_id: req.studentId,
      student_name: req.studentName || 'Student',
      student_email: req.studentEmail || 'student@student.vit.edu.in',
      student_department: normalizeDepartmentCode(req.studentDepartment),
      student_year: req.studentYear || 'BE',
      student_role: req.studentRole || 'student',
      student_enrollment_no: req.studentEnrollmentNo || null,
      mentor_id: req.mentorId,
      mentor_name: req.mentorName || 'Mentor',
      mentor_role: req.mentorRole || 'alumni',
      mentor_company_or_dept: req.mentorCompanyOrDept || 'VIT Mumbai',
      purpose_of_request: req.purposeOfRequest || 'Career Guidance',
      area_of_guidance: req.areaOfGuidance || 'Industry Placement',
      topic: req.topic || 'Mentorship Guidance',
      message: req.message || 'Requesting mentorship connection.',
      requested_date: req.requestedDate || new Date().toISOString(),
      expiry_date: req.expiryDate || new Date(Date.now() + 14 * 86400000).toISOString(),
      status: normalizeMentorshipStatus(req.status),
      request_type: req.requestType || 'MENTORSHIP',
      meeting_notes: req.meetingNotes || null,
      scheduled_time: req.scheduledTime || null,
      proposed_date: req.proposedDate || null,
      proposed_time_slot: req.proposedTimeSlot || null,
      decline_reason: null,
      feedback: null
    };

    if (requestId) {
      payload.id = requestId;
    }


    const row = await runMutation<any>(
      'INSERT',
      'mentorship_requests',
      async () => {
        return supabase.from('mentorship_requests').insert(payload).select().single();
      },
      { payload }
    );

    return mapRowToMentorshipRequest(row);
  },

  /**
   * Update request status (Accept, Decline, Complete, etc.)
   */
  async updateStatus(
    requestId: string,
    status: MentorshipRequestStatus,
    patch?: {

      declineReason?: string;
      meetingNotes?: string;
      scheduledTime?: string;
      proposedDate?: string;
      proposedTimeSlot?: string;
      feedback?: any;
    }
  ): Promise<MentorshipRequest> {
    const payload: any = { status: normalizeMentorshipStatus(status) };

    if (patch?.declineReason !== undefined) payload.decline_reason = patch.declineReason;
    if (patch?.meetingNotes !== undefined) payload.meeting_notes = patch.meetingNotes;
    if (patch?.scheduledTime !== undefined) payload.scheduled_time = patch.scheduledTime;
    if (patch?.proposedDate !== undefined) payload.proposed_date = patch.proposedDate;
    if (patch?.proposedTimeSlot !== undefined) payload.proposed_time_slot = patch.proposedTimeSlot;
    if (patch?.feedback !== undefined) payload.feedback = patch.feedback;

    const row = await runMutation<any>(
      'UPDATE',
      'mentorship_requests',
      async () => {
        return supabase.from('mentorship_requests').update(payload).eq('id', requestId).select().single();
      },
      { payload }
    );

    return mapRowToMentorshipRequest(row);
  }
};
