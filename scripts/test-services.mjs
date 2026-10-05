/**
 * NexaLink - Services Layer Comprehensive Test Suite
 * Tests:
 * 1. enumMappers (Department codes, arrays, mentorship/job/event status, date/timestamp formatting)
 * 2. supabaseRunner (Error hierarchy, runQuery, runMutation, runRpc, persistence verification)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Import enum mappers
import {
  VALID_DEPARTMENT_CODES,
  normalizeDepartmentCode,
  normalizeDepartmentArray,
  normalizeMentorshipStatus,
  normalizeJobStatus,
  normalizeModerationStatus,
  normalizeEventStatus,
  toPgDate,
  toPgTimestamp
} from '../src/utils/enumMappers.ts';

// Import supabaseRunner and custom error types
import {
  BaseSupabaseError,
  RlsForbiddenError,
  RpcNotFoundError,
  TableNotFoundError,
  UniqueViolationError,
  MutationDidNotPersistError,
  SupabaseOperationError,
  runQuery,
  runMutation,
  runRpc
} from '../src/services/supabaseRunner.ts';

// Import notification helpers
import {
  formatRelativeTime,
  groupNotificationsByDate,
  capUnreadCount,
  deduplicateNotifications
} from '../src/utils/notificationHelpers.ts';

// Import emailDomains configuration
import {
  classifyEmailDomain,
  isInstitutionalEmail,
  SIGN_IN_EMAIL_HELPER,
  INSTITUTIONAL_DOMAINS
} from '../src/config/emailDomains.ts';

import { mapUserDbToProfile } from '../src/services/profileService.ts';
import { redactUserPrivacyFields } from '../src/utils/privacyGuard.ts';
import {
  mapRowToApplication,
  normalizeApplicationStatus,
  validateApplicationPreflights
} from '../src/utils/applicationHelpers.ts';
import {
  computeNetworkMetrics,
  getNetworkCopy
} from '../src/components/landing/networkMapData.ts';

// ----------------------------------------------------------------------------
// 1. enumMappers Unit Tests
// ----------------------------------------------------------------------------
test('enumMappers: VALID_DEPARTMENT_CODES includes canonical codes', () => {
  assert.deepStrictEqual(VALID_DEPARTMENT_CODES, ['CMPN', 'INFT', 'EXTC', 'EXCS', 'BIOM']);
});

test('enumMappers: normalizeDepartmentCode canonical matching', () => {
  assert.strictEqual(normalizeDepartmentCode('CMPN'), 'CMPN');
  assert.strictEqual(normalizeDepartmentCode('INFT'), 'INFT');
  assert.strictEqual(normalizeDepartmentCode('EXTC'), 'EXTC');
  assert.strictEqual(normalizeDepartmentCode('EXCS'), 'EXCS');
  assert.strictEqual(normalizeDepartmentCode('BIOM'), 'BIOM');
});

test('enumMappers: normalizeDepartmentCode case and whitespace normalization', () => {
  assert.strictEqual(normalizeDepartmentCode('  cmpn  '), 'CMPN');
  assert.strictEqual(normalizeDepartmentCode('inft'), 'INFT');
  assert.strictEqual(normalizeDepartmentCode('Extc'), 'EXTC');
});

test('enumMappers: normalizeDepartmentCode full names and sub-strings', () => {
  assert.strictEqual(normalizeDepartmentCode('Computer Engineering'), 'CMPN');
  assert.strictEqual(normalizeDepartmentCode('B.Tech CSE'), 'CMPN');
  assert.strictEqual(normalizeDepartmentCode('Information Technology'), 'INFT');
  assert.strictEqual(normalizeDepartmentCode('IT Department'), 'INFT');
  assert.strictEqual(normalizeDepartmentCode('Electronics & Telecommunication'), 'EXTC');
  assert.strictEqual(normalizeDepartmentCode('Electronics & Computer Science'), 'EXCS');
  assert.strictEqual(normalizeDepartmentCode('ETRX'), 'EXCS');
  assert.strictEqual(normalizeDepartmentCode('Biomedical Engineering'), 'BIOM');
  assert.strictEqual(normalizeDepartmentCode('MCA Graduate'), 'CMPN');
});

test('enumMappers: normalizeDepartmentCode null, undefined and invalid fallbacks', () => {
  assert.strictEqual(normalizeDepartmentCode(null), 'CMPN');
  assert.strictEqual(normalizeDepartmentCode(undefined), 'CMPN');
  assert.strictEqual(normalizeDepartmentCode(''), 'CMPN');
  assert.strictEqual(normalizeDepartmentCode('Civil Engineering'), 'CMPN');
});

test('enumMappers: normalizeDepartmentArray deduplication and mapping', () => {
  assert.deepStrictEqual(normalizeDepartmentArray(null), ['CMPN']);
  assert.deepStrictEqual(normalizeDepartmentArray([]), ['CMPN']);
  assert.deepStrictEqual(normalizeDepartmentArray(['CMPN', 'cmpn', 'Computer']), ['CMPN']);
  assert.deepStrictEqual(normalizeDepartmentArray(['CMPN', 'INFT', 'EXTC']), ['CMPN', 'INFT', 'EXTC']);
  assert.deepStrictEqual(normalizeDepartmentArray(['IT', 'Biomedical']), ['INFT', 'BIOM']);
});

test('enumMappers: normalizeMentorshipStatus mapping', () => {
  assert.strictEqual(normalizeMentorshipStatus('pending'), 'Pending');
  assert.strictEqual(normalizeMentorshipStatus('Pending'), 'Pending');
  assert.strictEqual(normalizeMentorshipStatus('ACCEPTED'), 'Accepted');
  assert.strictEqual(normalizeMentorshipStatus('declined'), 'Declined');
  assert.strictEqual(normalizeMentorshipStatus('withdrawn'), 'Declined');
  assert.strictEqual(normalizeMentorshipStatus('completed'), 'Completed');
  assert.strictEqual(normalizeMentorshipStatus('expired'), 'Expired');
  assert.strictEqual(normalizeMentorshipStatus(null), 'Pending');
  assert.strictEqual(normalizeMentorshipStatus(undefined), 'Pending');
  assert.strictEqual(normalizeMentorshipStatus('unknown_status'), 'Pending');
});

test('enumMappers: normalizeJobStatus mapping', () => {
  assert.strictEqual(normalizeJobStatus('active'), 'Active');
  assert.strictEqual(normalizeJobStatus('Active'), 'Active');
  assert.strictEqual(normalizeJobStatus('closed'), 'Closed');
  assert.strictEqual(normalizeJobStatus('pending'), 'Pending Approval');
  assert.strictEqual(normalizeJobStatus('pending approval'), 'Pending Approval');
  assert.strictEqual(normalizeJobStatus(null), 'Active');
  assert.strictEqual(normalizeJobStatus(undefined), 'Active');
});

test('enumMappers: normalizeModerationStatus mapping', () => {
  assert.strictEqual(normalizeModerationStatus('approved'), 'Approved');
  assert.strictEqual(normalizeModerationStatus('rejected'), 'Rejected');
  assert.strictEqual(normalizeModerationStatus('pending'), 'Pending Approval');
  assert.strictEqual(normalizeModerationStatus(null), 'Approved');
});

test('enumMappers: normalizeEventStatus mapping', () => {
  assert.strictEqual(normalizeEventStatus('upcoming'), 'Upcoming');
  assert.strictEqual(normalizeEventStatus('completed'), 'Completed');
  assert.strictEqual(normalizeEventStatus('cancelled'), 'Cancelled');
  assert.strictEqual(normalizeEventStatus('canceled'), 'Cancelled');
  assert.strictEqual(normalizeEventStatus(null), 'Upcoming');
});

test('enumMappers: toPgDate formatting', () => {
  assert.strictEqual(toPgDate('2026-10-05'), '2026-10-05');
  assert.strictEqual(toPgDate('2026-10-05T14:30:00.000Z'), '2026-10-05');
  const d = new Date('2026-12-25T00:00:00.000Z');
  assert.strictEqual(toPgDate(d), '2026-12-25');
  // Fallback on null returns YYYY-MM-DD format
  const today = toPgDate(null);
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
});

test('enumMappers: toPgTimestamp formatting', () => {
  const iso = '2026-10-05T14:30:00.000Z';
  assert.strictEqual(toPgTimestamp(iso), iso);
  const now = toPgTimestamp(null);
  assert.ok(!isNaN(new Date(now).getTime()));
});

// ----------------------------------------------------------------------------
// 2. supabaseRunner Unit Tests
// ----------------------------------------------------------------------------
test('supabaseRunner: Error Class Hierarchy', () => {
  const rlsErr = new RlsForbiddenError('INSERT', 'chat_messages', { code: '42501' });
  assert.ok(rlsErr instanceof BaseSupabaseError);
  assert.strictEqual(rlsErr.name, 'RlsForbiddenError');
  assert.strictEqual(rlsErr.code, '42501');
  assert.strictEqual(rlsErr.operation, 'INSERT');
  assert.strictEqual(rlsErr.target, 'chat_messages');

  const rpcErr = new RpcNotFoundError('RPC', 'edit_message');
  assert.ok(rpcErr instanceof BaseSupabaseError);
  assert.strictEqual(rpcErr.code, 'PGRST202');

  const tblErr = new TableNotFoundError('SELECT', 'conversations');
  assert.ok(tblErr instanceof BaseSupabaseError);
  assert.strictEqual(tblErr.code, 'PGRST205');

  const unqErr = new UniqueViolationError('INSERT', 'users');
  assert.ok(unqErr instanceof BaseSupabaseError);
  assert.strictEqual(unqErr.code, '23505');

  const noPersistErr = new MutationDidNotPersistError('UPDATE', 'events');
  assert.ok(noPersistErr instanceof BaseSupabaseError);
  assert.strictEqual(noPersistErr.code, 'MUTATION_NO_ROWS');
});

test('supabaseRunner: runQuery success and fallback handling', async () => {
  // Successful query
  const res = await runQuery('users', async () => ({
    data: [{ id: 'u1', name: 'User 1' }],
    error: null
  }));
  assert.deepStrictEqual(res, [{ id: 'u1', name: 'User 1' }]);

  // Null data defaults to empty array
  const emptyRes = await runQuery('events', async () => ({
    data: null,
    error: null
  }));
  assert.deepStrictEqual(emptyRes, []);
});

test('supabaseRunner: runQuery error mapping to typed BaseSupabaseError', async () => {
  // 42501 -> RlsForbiddenError
  await assert.rejects(
    async () => {
      await runQuery('chat_messages', async () => ({
        data: null,
        error: { code: '42501', message: 'permission denied for table chat_messages' }
      }));
    },
    (err) => {
      assert.ok(err instanceof RlsForbiddenError);
      assert.strictEqual(err.code, '42501');
      return true;
    }
  );

  // PGRST205 -> TableNotFoundError
  await assert.rejects(
    async () => {
      await runQuery('legacy_table', async () => ({
        data: null,
        error: { code: 'PGRST205', message: 'table not found' }
      }));
    },
    (err) => {
      assert.ok(err instanceof TableNotFoundError);
      assert.strictEqual(err.code, 'PGRST205');
      return true;
    }
  );
});

test('supabaseRunner: runMutation persistence validation and allowEmptyResult', async () => {
  // Success with returned row
  const created = await runMutation('INSERT', 'events', async () => ({
    data: { id: 'evt-123', title: 'Tech Talk' },
    error: null
  }));
  assert.strictEqual(created.id, 'evt-123');

  // Mutation returned 0 rows without allowEmptyResult -> MutationDidNotPersistError
  await assert.rejects(
    async () => {
      await runMutation('UPDATE', 'jobs', async () => ({
        data: [],
        error: null
      }));
    },
    (err) => {
      assert.ok(err instanceof MutationDidNotPersistError);
      assert.strictEqual(err.code, 'MUTATION_NO_ROWS');
      return true;
    }
  );

  // Mutation with allowEmptyResult: true succeeds even with null/empty data
  const deleted = await runMutation(
    'DELETE',
    'notifications',
    async () => ({ data: [], error: null }),
    { allowEmptyResult: true }
  );
  assert.deepStrictEqual(deleted, []);
});

test('supabaseRunner: runMutation error mapping', async () => {
  // 23505 -> UniqueViolationError
  await assert.rejects(
    async () => {
      await runMutation('INSERT', 'users', async () => ({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' }
      }));
    },
    (err) => {
      assert.ok(err instanceof UniqueViolationError);
      assert.strictEqual(err.code, '23505');
      return true;
    }
  );
});

test('supabaseRunner: runRpc execution and error mapping', async () => {
  // Success
  const rpcRes = await runRpc('check_admin', async () => ({
    data: { is_admin: true },
    error: null
  }));
  assert.strictEqual(rpcRes.is_admin, true);

  // PGRST202 -> RpcNotFoundError
  await assert.rejects(
    async () => {
      await runRpc('missing_func', async () => ({
        data: null,
        error: { code: 'PGRST202', message: 'function missing_func not found' }
      }));
    },
    (err) => {
      assert.ok(err instanceof RpcNotFoundError);
      assert.strictEqual(err.code, 'PGRST202');
      return true;
    }
  );
});

// ----------------------------------------------------------------------------
// 3. notificationHelpers Unit Tests
// ----------------------------------------------------------------------------
test('notificationHelpers: capUnreadCount capping at 99+', () => {
  assert.strictEqual(capUnreadCount(0), '0');
  assert.strictEqual(capUnreadCount(-5), '0');
  assert.strictEqual(capUnreadCount(1), '1');
  assert.strictEqual(capUnreadCount(5), '5');
  assert.strictEqual(capUnreadCount(99), '99');
  assert.strictEqual(capUnreadCount(100), '99+');
  assert.strictEqual(capUnreadCount(250), '99+');
});

test('notificationHelpers: deduplicateNotifications eliminates duplicate IDs and dedupe_keys', () => {
  const items = [
    { id: 'n-1', user_id: 'u-1', title: 'A', body: 'Msg 1', type: 'Opportunity Alert', is_read: false, created_at: new Date().toISOString(), dedupe_key: 'job_1' },
    { id: 'n-1', user_id: 'u-1', title: 'A Duplicate ID', body: 'Msg 1 duplicate', type: 'Opportunity Alert', is_read: false, created_at: new Date().toISOString(), dedupe_key: 'job_1_diff' },
    { id: 'n-2', user_id: 'u-1', title: 'B', body: 'Msg 2', type: 'Opportunity Alert', is_read: false, created_at: new Date().toISOString(), dedupe_key: 'job_1' }, // Duplicate dedupe_key
    { id: 'n-3', user_id: 'u-1', title: 'C', body: 'Msg 3', type: 'Event Reminder', is_read: true, created_at: new Date().toISOString(), dedupe_key: 'event_1' }
  ];

  const deduped = deduplicateNotifications(items);
  assert.strictEqual(deduped.length, 2);
  assert.strictEqual(deduped[0].id, 'n-1');
  assert.strictEqual(deduped[1].id, 'n-3');
});

test('notificationHelpers: groupNotificationsByDate splits into Today and Earlier', () => {
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0).toISOString();
  const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago

  const items = [
    { id: 'n-today', user_id: 'u-1', title: 'Today Alert', body: 'Today', type: 'System Alert', is_read: false, created_at: todayDate },
    { id: 'n-earlier', user_id: 'u-1', title: 'Old Alert', body: 'Old', type: 'System Alert', is_read: true, created_at: pastDate }
  ];

  const { today, earlier } = groupNotificationsByDate(items);
  assert.strictEqual(today.length, 1);
  assert.strictEqual(today[0].id, 'n-today');
  assert.strictEqual(earlier.length, 1);
  assert.strictEqual(earlier[0].id, 'n-earlier');
});

test('notificationHelpers: formatRelativeTime handles relative offsets correctly', () => {
  const now = new Date();
  assert.strictEqual(formatRelativeTime(now.toISOString()), 'Just now');
  assert.strictEqual(formatRelativeTime(new Date(now.getTime() - 5 * 60 * 1000).toISOString()), '5m ago');
  assert.strictEqual(formatRelativeTime(new Date(now.getTime() - 3 * 3600 * 1000).toISOString()), '3h ago');
  assert.strictEqual(formatRelativeTime(new Date(now.getTime() - 25 * 3600 * 1000).toISOString()), 'Yesterday');
});

// ----------------------------------------------------------------------------
// 6. emailDomains Configuration Unit Tests
// ----------------------------------------------------------------------------
test('emailDomains: classifies @student.vit.edu.in as institutional student', () => {
  const result = classifyEmailDomain('x@student.vit.edu.in');
  assert.strictEqual(result.isInstitutional, true);
  assert.strictEqual(result.suggestedRole, 'student');
  assert.strictEqual(result.domain, 'student.vit.edu.in');
});

test('emailDomains: classifies @vit.edu.in as institutional with no presumptive role', () => {
  const result = classifyEmailDomain('abdur.rahman@vit.edu.in');
  assert.strictEqual(result.isInstitutional, true);
  assert.strictEqual(result.suggestedRole, undefined);
  assert.strictEqual(result.domain, 'vit.edu.in');
});

test('emailDomains: classifies personal domains as non-institutional alumni suggestion', () => {
  const result = classifyEmailDomain('someone@gmail.com');
  assert.strictEqual(result.isInstitutional, false);
  assert.strictEqual(result.suggestedRole, 'alumni');
  assert.strictEqual(result.domain, 'gmail.com');
});

test('emailDomains: handles invalid/empty emails safely', () => {
  assert.strictEqual(classifyEmailDomain('').isInstitutional, false);
  assert.strictEqual(classifyEmailDomain('no-at-sign').isInstitutional, false);
  assert.strictEqual(classifyEmailDomain('trailing-at@').isInstitutional, false);
});

test('emailDomains: isInstitutionalEmail validates canonical domains accurately', () => {
  assert.strictEqual(isInstitutionalEmail('test@student.vit.edu.in'), true);
  assert.strictEqual(isInstitutionalEmail('faculty@vit.edu.in'), true);
  assert.strictEqual(isInstitutionalEmail('alumni@yahoo.com'), false);
  assert.strictEqual(isInstitutionalEmail('fake@vit.edu.in.evil.com'), false);
});

test('emailDomains: SIGN_IN_EMAIL_HELPER is neutral and non-presumptive', () => {
  assert.strictEqual(SIGN_IN_EMAIL_HELPER, 'Use your institutional email. Alumni can use their personal email.');
});

// ----------------------------------------------------------------------------
// 7. profileService & mapUserDbToProfile Unit Tests
// ----------------------------------------------------------------------------
test('mapUserDbToProfile: correctly maps student with institutional and personal email', () => {
  const userRow = {
    id: 'user-123',
    name: 'Abdur Rahman',
    email: 'abdur.rahman@vit.edu.in',
    personal_email: 'rahman.studyjee@gmail.com',
    role: 'student',
    department: 'CMPN',
    bio: 'Aspiring AI engineer',
    phone: '+91 9876543210',
    avatar_url: null
  };
  const roleRow = {
    user_id: 'user-123',
    semester: 'Semester 4',
    current_year: 'SE',
    skills: ['Python', 'TypeScript', 'React'],
    career_goal: 'Software Engineer',
    preferred_industry: 'Tech'
  };

  const profile = mapUserDbToProfile(userRow, roleRow);
  assert.strictEqual(profile.id, 'user-123');
  assert.strictEqual(profile.name, 'Abdur Rahman');
  assert.strictEqual(profile.email, 'abdur.rahman@vit.edu.in');
  assert.strictEqual(profile.personalEmail, 'rahman.studyjee@gmail.com');
  assert.strictEqual(profile.role, 'student');
  assert.strictEqual(profile.semester, 'Semester 4');
  assert.strictEqual(profile.currentYear, 'SE');
  assert.strictEqual(profile.careerGoal, 'Software Engineer');
  assert.deepStrictEqual(profile.skills, ['Python', 'TypeScript', 'React']);
});

test('mapUserDbToProfile: correctly maps alumni profile fields', () => {
  const userRow = {
    id: 'alumni-456',
    name: 'Jane Doe',
    email: 'jane@gmail.com',
    role: 'alumni',
    department: 'CMPN',
    bio: 'Senior Engineer at Google'
  };
  const roleRow = {
    user_id: 'alumni-456',
    company: 'Google',
    designation: 'Staff SWE',
    graduation_year: 2020,
    is_mentoring_available: true,
    max_mentees: 5
  };

  const profile = mapUserDbToProfile(userRow, roleRow);
  assert.strictEqual(profile.role, 'alumni');
  assert.strictEqual(profile.company, 'Google');
  assert.strictEqual(profile.designation, 'Staff SWE');
  assert.strictEqual(profile.graduationYear, 2020);
  assert.strictEqual(profile.maxMentees, 5);
  assert.strictEqual(profile.isMentoringAvailable, true);
});

test('redactUserPrivacyFields: redacts personal email and private phone for other viewers', () => {
  const student = {
    id: 'student-1',
    name: 'Abdur',
    email: 'abdur@vit.edu.in',
    personalEmail: 'abdur@gmail.com',
    phone: '+91 9999999999',
    role: 'student',
    avatar: '',
    department: 'CMPN',
    privacySettings: {
      email: 'institution',
      phone: 'private',
      company: 'public',
      higherEd: 'public'
    }
  };

  const viewer = {
    id: 'other-user',
    name: 'Peer',
    email: 'peer@vit.edu.in',
    role: 'student',
    avatar: '',
    department: 'CMPN'
  };

  const redacted = redactUserPrivacyFields(student, viewer);
  assert.strictEqual(redacted.personalEmail, undefined, 'Personal recovery email should not be exposed to other viewers');
  assert.strictEqual(redacted.phone, undefined, 'Private phone should be redacted for other viewers');
  assert.strictEqual(redacted.email, 'abdur@vit.edu.in', 'Institutional email is visible to logged-in user');
});

test('redactUserPrivacyFields: preserves personal details when viewing own profile', () => {
  const student = {
    id: 'student-1',
    name: 'Abdur',
    email: 'abdur@vit.edu.in',
    personalEmail: 'abdur@gmail.com',
    phone: '+91 9999999999',
    role: 'student',
    avatar: '',
    department: 'CMPN'
  };

  const selfRedacted = redactUserPrivacyFields(student, student);
  assert.strictEqual(selfRedacted.personalEmail, 'abdur@gmail.com');
  assert.strictEqual(selfRedacted.phone, '+91 9999999999');
});

// ----------------------------------------------------------------------------
// 6. Opportunity Applications Pipeline Tests
// ----------------------------------------------------------------------------
test('mapRowToApplication: correctly maps database row columns and normalizes status', () => {
  const row = {
    id: 'app-uuid-1',
    job_id: 'job-uuid-1',
    applicant_id: 'user-student-1',
    applicant_name: 'Ananya Sharma',
    applicant_email: 'ananya.s@vit.edu.in',
    applicant_department: 'CMPN',
    applicant_year: '2026',
    applied_at: '2026-03-15T12:00:00Z',
    status: 'Submitted',
    status_updated_at: '2026-03-15T12:05:00Z',
    cover_note: 'Excited to apply for this backend engineering role.',
    resume_url: 'resumes/ananya-sharma.pdf',
    poster_note: 'Strong candidate with Docker experience'
  };

  const mapped = mapRowToApplication(row);

  assert.strictEqual(mapped.id, 'app-uuid-1');
  assert.strictEqual(mapped.opportunityId, 'job-uuid-1');
  assert.strictEqual(mapped.applicantId, 'user-student-1');
  assert.strictEqual(mapped.applicantName, 'Ananya Sharma');
  assert.strictEqual(mapped.applicantEmail, 'ananya.s@vit.edu.in');
  assert.strictEqual(mapped.applicantDepartment, 'CMPN');
  assert.strictEqual(mapped.applicantYear, '2026');
  assert.strictEqual(mapped.status, 'submitted', 'Status should be normalized to lowercase canonical status');
  assert.strictEqual(mapped.studentNote, 'Excited to apply for this backend engineering role.');
  assert.strictEqual(mapped.resumePath, 'resumes/ananya-sharma.pdf');
  assert.strictEqual(mapped.posterNote, 'Strong candidate with Docker experience');
});

test('normalizeApplicationStatus: normalizes various status casing and defaults unknown to submitted', () => {
  assert.strictEqual(normalizeApplicationStatus('VIEWED'), 'viewed');
  assert.strictEqual(normalizeApplicationStatus('under review'), 'viewed');
  assert.strictEqual(normalizeApplicationStatus('Shortlisted'), 'shortlisted');
  assert.strictEqual(normalizeApplicationStatus('Not Selected'), 'not_selected');
  assert.strictEqual(normalizeApplicationStatus('rejected'), 'not_selected');
  assert.strictEqual(normalizeApplicationStatus('CustomStatus'), 'submitted');
  assert.strictEqual(normalizeApplicationStatus(undefined), 'submitted');
});

test('validateApplicationPreflights: correctly enforces preflight business rules', () => {
  const verifiedStudent = { id: 'student-1', isVerified: true };
  const unverifiedStudent = { id: 'student-2', isVerified: false };
  const job = { id: 'job-1', postedByAlumniId: 'alumni-1', status: 'Active', applicationDeadline: '2026-12-31' };

  // 1. Unverified candidate
  const unverifiedRes = validateApplicationPreflights({ currentUser: unverifiedStudent, job });
  assert.strictEqual(unverifiedRes.canApply, false);
  assert.match(unverifiedRes.reason || '', /verified/i);

  // 2. Self application
  const ownJobRes = validateApplicationPreflights({ currentUser: verifiedStudent, job: { ...job, postedByAlumniId: 'student-1' } });
  assert.strictEqual(ownJobRes.canApply, false);
  assert.match(ownJobRes.reason || '', /published/i);

  // 3. Closed job
  const closedRes = validateApplicationPreflights({ currentUser: verifiedStudent, job: { ...job, status: 'Closed' } });
  assert.strictEqual(closedRes.canApply, false);
  assert.match(closedRes.reason || '', /closed/i);

  // 4. Past deadline
  const expiredRes = validateApplicationPreflights({ currentUser: verifiedStudent, job: { ...job, applicationDeadline: '2020-01-01' } });
  assert.strictEqual(expiredRes.canApply, false);
  assert.match(expiredRes.reason || '', /deadline/i);

  // 5. Already applied
  const duplicateRes = validateApplicationPreflights({ currentUser: verifiedStudent, job, hasAlreadyApplied: true });
  assert.strictEqual(duplicateRes.canApply, false);
  assert.match(duplicateRes.reason || '', /already/i);

  // 6. Valid candidate passes
  const validRes = validateApplicationPreflights({ currentUser: verifiedStudent, job, hasAlreadyApplied: false });
  assert.strictEqual(validRes.canApply, true);
  assert.strictEqual(validRes.reason, undefined);
});

// ----------------------------------------------------------------------------
// 7. Global Alumni Network Metrics & Copy Unit Tests
// ----------------------------------------------------------------------------
test('networkMapData: Scenario 1 - 0 alumni', () => {
  const data = {
    totals: { verified_alumni: 0, countries: 0, cities: 0 },
    cities: []
  };
  const metrics = computeNetworkMetrics(data);
  assert.strictEqual(metrics.verifiedAlumni, 0);
  assert.strictEqual(metrics.locatedAlumni, 0);
  assert.strictEqual(metrics.unlocatedAlumni, 0);
  assert.strictEqual(metrics.cities, 0);
  assert.strictEqual(metrics.countries, 0);

  const copy = getNetworkCopy(metrics);
  assert.strictEqual(copy.caption, 'No alumni on the map yet. Be the first.');
  assert.strictEqual(copy.ctaLabel, 'Create account →');
  assert.strictEqual(copy.ctaAction, 'createAccount');
  assert.strictEqual(copy.showCaption, true);
});

test('networkMapData: Scenario 2 - 2 alumni all in Mumbai (Today DB case)', () => {
  const data = {
    totals: { verified_alumni: 2, countries: 1, cities: 1 },
    cities: [{ city: 'Mumbai', country: 'India', alumni_count: 2 }]
  };
  const metrics = computeNetworkMetrics(data);
  assert.strictEqual(metrics.verifiedAlumni, 2);
  assert.strictEqual(metrics.locatedAlumni, 2);
  assert.strictEqual(metrics.unlocatedAlumni, 0);
  assert.strictEqual(metrics.cities, 1);
  assert.strictEqual(metrics.countries, 1);
  assert.strictEqual(metrics.mumbaiAlumniCount, 2);
  assert.strictEqual(metrics.primaryCityName, 'Mumbai');

  const copy = getNetworkCopy(metrics);
  assert.strictEqual(copy.caption, 'All 2 verified alumni are in Mumbai so far. Join from anywhere.');
  assert.strictEqual(copy.ctaLabel, 'Sign in →');
  assert.strictEqual(copy.ctaAction, 'signIn');
  assert.strictEqual(copy.showCaption, true);
  assert.strictEqual(copy.tooltipSuffix, undefined);
});

test('networkMapData: Scenario 3 - 2 alumni with no city (all unlocated)', () => {
  const data = {
    totals: { verified_alumni: 2, countries: 0, cities: 0 },
    cities: []
  };
  const metrics = computeNetworkMetrics(data);
  assert.strictEqual(metrics.verifiedAlumni, 2);
  assert.strictEqual(metrics.locatedAlumni, 0);
  assert.strictEqual(metrics.unlocatedAlumni, 2);
  assert.strictEqual(metrics.cities, 0);
  assert.strictEqual(metrics.countries, 0);

  const copy = getNetworkCopy(metrics);
  assert.strictEqual(copy.caption, '2 verified alumni, locations coming soon.');
  assert.strictEqual(copy.ctaLabel, undefined);
  assert.strictEqual(copy.showCaption, true);
});

test('networkMapData: Scenario 4 - 5 alumni across 3 cities (cities >= 2)', () => {
  const data = {
    totals: { verified_alumni: 5, countries: 2, cities: 3 },
    cities: [
      { city: 'Mumbai', country: 'India', alumni_count: 2 },
      { city: 'London', country: 'United Kingdom', alumni_count: 2 },
      { city: 'San Francisco', country: 'United States', alumni_count: 1 }
    ]
  };
  const metrics = computeNetworkMetrics(data);
  assert.strictEqual(metrics.verifiedAlumni, 5);
  assert.strictEqual(metrics.locatedAlumni, 5);
  assert.strictEqual(metrics.unlocatedAlumni, 0);
  assert.strictEqual(metrics.cities, 3);
  assert.strictEqual(metrics.countries, 3); // Mumbai(India), London(UK), SF(US)

  const copy = getNetworkCopy(metrics);
  assert.strictEqual(copy.showCaption, false, 'Caption should be hidden when cities >= 2 to give space to globe');
  assert.strictEqual(copy.tooltipSuffix, undefined);
});

test('networkMapData: Scenario 5 - 1 alumnus in Mumbai', () => {
  const data = {
    totals: { verified_alumni: 1, countries: 1, cities: 1 },
    cities: [{ city: 'Mumbai', country: 'India', alumni_count: 1 }]
  };
  const metrics = computeNetworkMetrics(data);
  assert.strictEqual(metrics.verifiedAlumni, 1);
  assert.strictEqual(metrics.locatedAlumni, 1);
  assert.strictEqual(metrics.unlocatedAlumni, 0);
  assert.strictEqual(metrics.cities, 1);
  assert.strictEqual(metrics.countries, 1);
  assert.strictEqual(metrics.mumbaiAlumniCount, 1);

  const copy = getNetworkCopy(metrics);
  assert.strictEqual(copy.caption, 'The 1 verified alumnus is in Mumbai so far. Join from anywhere.');
  assert.strictEqual(copy.ctaLabel, 'Sign in →');
  assert.strictEqual(copy.ctaAction, 'signIn');
  assert.strictEqual(copy.showCaption, true);
});

test('networkMapData: Scenario with unlocated alumni alongside located cities', () => {
  const data = {
    totals: { verified_alumni: 5, countries: 1, cities: 1 },
    cities: [{ city: 'Mumbai', country: 'India', alumni_count: 3 }]
  };
  const metrics = computeNetworkMetrics(data);
  assert.strictEqual(metrics.verifiedAlumni, 5);
  assert.strictEqual(metrics.locatedAlumni, 3);
  assert.strictEqual(metrics.unlocatedAlumni, 2);
  assert.strictEqual(metrics.cities, 1);

  const copy = getNetworkCopy(metrics);
  assert.strictEqual(copy.caption, 'All 3 verified alumni are in Mumbai so far. Join from anywhere.');
  assert.strictEqual(copy.tooltipSuffix, "2 haven't added a city yet");
});

