import type { OpportunityApplication, OpportunityApplicationStatus, JobListing } from '../types';

/**
 * Normalizes any database or legacy status string to canonical OpportunityApplicationStatus
 */
export function normalizeApplicationStatus(rawStatus?: string): OpportunityApplicationStatus {
  if (!rawStatus) return 'submitted';
  const clean = rawStatus.toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (clean === 'shortlisted') return 'shortlisted';
  if (clean === 'not_selected' || clean === 'rejected') return 'not_selected';
  if (clean === 'viewed' || clean === 'reviewed' || clean === 'under_review') return 'viewed';
  return 'submitted';
}

/**
 * Maps raw database row from public.job_applications into typed OpportunityApplication
 */
export function mapRowToApplication(r: any): OpportunityApplication {
  const status = normalizeApplicationStatus(r.status);

  return {
    id: r.id,
    opportunityId: r.job_id,
    applicantId: r.applicant_id,
    applicantName: r.applicant_name,
    applicantEmail: r.applicant_email,
    applicantDepartment: r.applicant_department || 'CMPN',
    applicantYear: r.applicant_year || '2026',
    appliedAt: r.applied_at || new Date().toISOString(),
    status,
    statusUpdatedAt: r.status_updated_at || undefined,
    studentNote: r.cover_note || undefined,
    resumePath: r.resume_url || undefined,
    posterNote: r.poster_note || undefined
  };
}

/**
 * Validates application preflight criteria on the client side before opening or submitting sheet
 */
export function validateApplicationPreflights(params: {
  currentUser?: { id?: string; isVerified?: boolean } | null;
  job?: Partial<JobListing> | null;
  hasAlreadyApplied?: boolean;
}): { canApply: boolean; reason?: string } {
  const { currentUser, job, hasAlreadyApplied } = params;

  if (!currentUser?.id) {
    return { canApply: false, reason: 'You must be signed in to apply for opportunities.' };
  }

  if (!currentUser.isVerified) {
    return { canApply: false, reason: 'Only verified institutional members may apply for opportunities.' };
  }

  if (!job) {
    return { canApply: false, reason: 'Opportunity could not be found.' };
  }

  if (job.postedByAlumniId && job.postedByAlumniId === currentUser.id) {
    return { canApply: false, reason: 'You cannot apply to an opportunity you published.' };
  }

  if (job.status === 'Closed' || job.lifecycleStatus === 'closed') {
    return { canApply: false, reason: 'This opportunity is closed and no longer accepting applications.' };
  }

  if (job.applicationDeadline) {
    const deadline = new Date(job.applicationDeadline);
    deadline.setHours(23, 59, 59, 999);
    if (Date.now() > deadline.getTime()) {
      return { canApply: false, reason: 'The application deadline for this opportunity has passed.' };
    }
  }

  if (hasAlreadyApplied) {
    return { canApply: false, reason: 'You have already submitted an application for this opportunity.' };
  }

  return { canApply: true };
}
