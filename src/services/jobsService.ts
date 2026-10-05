import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { runQuery, runMutation } from './supabaseRunner';
import type { JobListing, DepartmentCode, OpportunityApplication, OpportunityApplicationStatus } from '../types';
import { normalizeDepartmentArray, normalizeJobStatus, normalizeModerationStatus, toPgTimestamp } from '../utils/enumMappers';


function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function mapRowToJob(j: any): JobListing {
  return {
    id: j.id,
    title: j.title,
    company: j.company,
    companyLogo: j.company_logo || undefined,
    location: j.location,
    type: j.type,
    stipendOrSalary: j.stipend_or_salary,
    department: j.department || [],
    skillsRequired: j.skills_required || [],
    postedByAlumniId: j.posted_by_alumni_id,
    postedByAlumniName: j.posted_by_alumni_name,
    postedByRole: j.posted_by_role || undefined,
    postedDate: j.posted_date,
    applicationDeadline: j.application_deadline,
    description: j.description,
    requirements: j.requirements || [],
    referralProvided: j.referral_provided,
    applicantsCount: j.applicants_count || 0,
    status: j.status || 'Active',
    moderationStatus: j.moderation_status || 'Approved',
    rejectionReason: j.rejection_reason || undefined
  };
}

export const jobsService = {
  /**
   * Fetch all jobs ordered by posted date descending
   */
  async getJobs(): Promise<JobListing[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const rows = await runQuery<any[]>('jobs', async () => {
      return supabase.from('jobs').select('*').order('posted_date', { ascending: false });
    });

    return (rows || []).map(mapRowToJob);
  },

  /**
   * Create a job opportunity with verified persistence
   */
  async createJob(
    jobData: Omit<JobListing, 'id' | 'postedDate' | 'applicantsCount' | 'status'> & { id?: string; postedDate?: string; status?: any }
  ): Promise<JobListing> {
    const jobId = isValidUuid(jobData.id)
      ? jobData.id!
      : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);

    const payload: any = {
      title: jobData.title || 'Untitled Opportunity',
      company: jobData.company || 'Institutional Partner',
      company_logo: jobData.companyLogo || null,
      location: jobData.location || 'Mumbai, India',
      type: jobData.type || 'Full-time',
      stipend_or_salary: jobData.stipendOrSalary || 'Competitive',
      department: normalizeDepartmentArray(jobData.department as any),
      skills_required: jobData.skillsRequired || [],
      posted_by_alumni_id: jobData.postedByAlumniId,
      posted_by_alumni_name: jobData.postedByAlumniName || 'Alumni Partner',
      posted_by_role: jobData.postedByRole || 'alumni',
      posted_date: toPgTimestamp(jobData.postedDate),
      application_deadline: toPgTimestamp(jobData.applicationDeadline || new Date(Date.now() + 30 * 86400000)),
      description: jobData.description || 'Details to be announced.',
      requirements: jobData.requirements || [],
      referral_provided: Boolean(jobData.referralProvided),
      applicants_count: 0,
      status: normalizeJobStatus(jobData.status),
      moderation_status: normalizeModerationStatus(jobData.moderationStatus),
      rejection_reason: jobData.rejectionReason || null
    };

    if (jobId) {
      payload.id = jobId;
    }


    const row = await runMutation<any>(
      'INSERT',
      'jobs',
      async () => {
        return supabase.from('jobs').insert(payload).select().single();
      },
      { payload }
    );

    return mapRowToJob(row);
  },

  /**
   * Update an existing job opportunity
   */
  async updateJob(jobId: string, patch: Partial<JobListing>): Promise<JobListing> {
    const payload: any = {};
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.company !== undefined) payload.company = patch.company;
    if (patch.location !== undefined) payload.location = patch.location;
    if (patch.type !== undefined) payload.type = patch.type;
    if (patch.stipendOrSalary !== undefined) payload.stipend_or_salary = patch.stipendOrSalary;
    if (patch.department !== undefined) payload.department = normalizeDepartmentArray(patch.department as any);
    if (patch.skillsRequired !== undefined) payload.skills_required = patch.skillsRequired;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.requirements !== undefined) payload.requirements = patch.requirements;
    if (patch.referralProvided !== undefined) payload.referral_provided = patch.referralProvided;
    if (patch.status !== undefined) payload.status = normalizeJobStatus(patch.status);
    if (patch.moderationStatus !== undefined) payload.moderation_status = normalizeModerationStatus(patch.moderationStatus);
    if (patch.rejectionReason !== undefined) payload.rejection_reason = patch.rejectionReason;
    if (patch.applicantsCount !== undefined) payload.applicants_count = patch.applicantsCount;


    const row = await runMutation<any>(
      'UPDATE',
      'jobs',
      async () => {
        return supabase.from('jobs').update(payload).eq('id', jobId).select().single();
      },
      { payload }
    );

    return mapRowToJob(row);
  },

  /**
   * Fetch all job applications
   */
  async getApplications(): Promise<OpportunityApplication[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const rows = await runQuery<any[]>('job_applications', async () => {
        return (supabase.from as any)('job_applications').select('*').order('applied_at', { ascending: false });
      });
      return (rows || []).map((r: any) => ({
        id: r.id,
        opportunityId: r.job_id,
        applicantId: r.applicant_id,
        applicantName: r.applicant_name,
        applicantEmail: r.applicant_email,
        applicantDepartment: 'CMPN',
        applicantYear: '2026',
        appliedAt: r.applied_at,
        status: (r.status?.toLowerCase() === 'shortlisted' ? 'shortlisted' : r.status?.toLowerCase() === 'not_selected' ? 'not_selected' : r.status?.toLowerCase() === 'viewed' ? 'viewed' : 'submitted') as OpportunityApplicationStatus,
        statusUpdatedAt: r.status_updated_at || undefined,
        studentNote: r.cover_note || undefined,
        resumePath: r.resume_url || undefined,
        posterNote: r.poster_note || undefined
      }));
    } catch {
      return [];
    }
  },

  /**
   * Submit an application for a job opportunity
   */
  async submitApplication(app: {
    opportunityId: string;
    applicantId: string;
    applicantName: string;
    applicantEmail: string;
    resumeUrl?: string;
    coverNote?: string;
  }): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const payload = {
      job_id: app.opportunityId,
      applicant_id: app.applicantId,
      applicant_name: app.applicantName,
      applicant_email: app.applicantEmail,
      resume_url: app.resumeUrl || null,
      cover_note: app.coverNote || null
    };
    await runMutation('INSERT', 'job_applications', async () => {
      return (supabase.from as any)('job_applications').insert(payload).select().single();
    }, { payload });
  },

  /**
   * Update application review status
   */
  async updateApplicationStatus(applicationId: string, status: OpportunityApplicationStatus, note?: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const payload: any = {
      status,
      status_updated_at: new Date().toISOString()
    };
    if (note !== undefined) payload.poster_note = note;
    await runMutation('UPDATE', 'job_applications', async () => {
      return (supabase.from as any)('job_applications').update(payload).eq('id', applicationId).select().single();
    }, { payload });
  }
};
