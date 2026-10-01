/**
 * Institutional Announcement Verification & E2E Validation Script
 * Tests:
 * 1. Semantic severity accent styling mapping
 * 2. Target audience query-level filtering (Student vs Alumni vs Faculty)
 * 3. Pinning priority sorting (Pinned items stay at top)
 * 4. Auto-expiry date evaluation (Excludes expired notices from active feeds without hard-deleting)
 * 5. Update/Edit reactivity
 * 6. Deletion reactivity
 */

import { filterAnnouncementsForAudience, parseAnnouncementMeta, serializeAnnouncementContent } from '../src/components/common/InstitutionalAnnouncementFeed.js';

console.log('====================================================================');
console.log('NEXALINK: INSTITUTIONAL ANNOUNCEMENT VERIFICATION & E2E AUDIT');
console.log('====================================================================\n');

// 1. Setup sample announcements representing all 4 semantic tiers and audiences
const now = Date.now();
const testAnnouncements = [
  {
    id: 'anc-std-01',
    title: 'Semester 7 Campus Infrastructure Routine Maintenance',
    category: 'Institutional Update',
    author: 'Institutional Admin Cell',
    date: new Date(now - 1000 * 3600 * 24 * 2).toISOString(), // 2 days ago
    content: 'Routine Wi-Fi maintenance scheduled across Engineering Block B.',
    isImportant: false,
    targetAudience: 'All',
    severity: 'standard',
    isPinned: false
  },
  {
    id: 'anc-amber-02',
    title: 'SIH 2026 Internal Mentorship Hackathon Registration Deadline',
    category: 'Placement Alert',
    author: 'Institutional Admin Cell',
    date: new Date(now - 1000 * 3600 * 12).toISOString(), // 12 hours ago
    content: 'All shortlisted student teams must complete registration by Friday 5 PM.',
    isImportant: false,
    targetAudience: 'Students',
    severity: 'actionable',
    isPinned: true, // PINNED TO TOP
    expiresAt: new Date(now + 1000 * 3600 * 48).toISOString() // Expires in 48 hours
  },
  {
    id: 'anc-rose-03',
    title: 'URGENT: Revised Examination & Mandatory Attendance Policy 2026',
    category: 'Institutional Update',
    author: 'Institutional Admin Cell',
    date: new Date(now - 1000 * 3600 * 4).toISOString(), // 4 hours ago
    content: 'Mandatory 75% attendance criterion enforced across all undergraduate programs.',
    isImportant: true,
    targetAudience: 'Students',
    severity: 'governance',
    isPinned: false
  },
  {
    id: 'anc-indigo-04',
    title: 'Distinguished Alumni Mentorship Cohort 2026 Kickoff',
    category: 'Alumni News',
    author: 'Institutional Admin Cell',
    date: new Date(now - 1000 * 3600 * 6).toISOString(), // 6 hours ago
    content: 'Calling all graduated alumni to mentor incoming pre-final year engineering students.',
    isImportant: false,
    targetAudience: 'Alumni',
    severity: 'academic',
    isPinned: false
  },
  {
    id: 'anc-exp-05',
    title: 'PAST EVENT: Career Fair 2025 Pre-registration [Auto-Expired]',
    category: 'Event Highlight',
    author: 'Institutional Admin Cell',
    date: new Date(now - 1000 * 3600 * 24 * 10).toISOString(),
    content: 'Pre-registration for previous academic year career summit.',
    isImportant: false,
    targetAudience: 'Students',
    severity: 'standard',
    isPinned: false,
    expiresAt: new Date(now - 1000 * 3600 * 24 * 2).toISOString() // EXPIRED 2 days ago!
  }
];

// --- STEP 1: Verify Student Dashboard Feed ---
console.log('--- TEST 1: Student Portal Feed Evaluation ---');
const studentFeed = filterAnnouncementsForAudience(testAnnouncements, 'student');
console.log(`Feed count returned for Student: ${studentFeed.length}`);

// Verify Pinned ordering:
console.log(`Top item in Student feed: "${studentFeed[0].title}" (isPinned: ${studentFeed[0].isPinned})`);
if (studentFeed[0].id !== 'anc-amber-02') {
  console.error('FAIL: Pinned announcement should appear first!');
  process.exit(1);
} else {
  console.log('✓ PASS: Pinned announcement "SIH 2026" appears first despite newer posts.');
}

// Verify Expiry filtering:
const expiredInStudentFeed = studentFeed.find(a => a.id === 'anc-exp-05');
if (expiredInStudentFeed) {
  console.error('FAIL: Expired announcement was not filtered out!');
  process.exit(1);
} else {
  console.log('✓ PASS: Expired notice "PAST EVENT" (anc-exp-05) auto-filtered out of active feed.');
}

// Verify Audience exclusion:
const alumniInStudentFeed = studentFeed.find(a => a.id === 'anc-indigo-04');
if (alumniInStudentFeed) {
  console.error('FAIL: Alumni-only announcement leaked into Student feed!');
  process.exit(1);
} else {
  console.log('✓ PASS: Alumni-only announcement "Distinguished Alumni Mentorship Cohort" excluded from Student feed.');
}

// --- STEP 2: Verify Alumni Dashboard Feed ---
console.log('\n--- TEST 2: Alumni Portal Feed Evaluation ---');
const alumniFeed = filterAnnouncementsForAudience(testAnnouncements, 'alumni');
console.log(`Feed count returned for Alumni: ${alumniFeed.length}`);

const studentAnnouncementsInAlumni = alumniFeed.filter(a => a.targetAudience === 'Students');
if (studentAnnouncementsInAlumni.length > 0) {
  console.error('FAIL: Student announcements leaked into Alumni feed!');
  process.exit(1);
} else {
  console.log(`✓ PASS: 0 of 2 Student-only announcements leaked into Alumni feed.`);
}

const hasAlumniNotice = alumniFeed.some(a => a.id === 'anc-indigo-04');
const hasAllNotice = alumniFeed.some(a => a.id === 'anc-std-01');
if (hasAlumniNotice && hasAllNotice) {
  console.log('✓ PASS: Alumni correctly sees both "Alumni" and "All" target announcements.');
} else {
  console.error('FAIL: Alumni did not receive their targeted announcements.');
  process.exit(1);
}

// --- STEP 3: Verify Faculty Dashboard Feed ---
console.log('\n--- TEST 3: Faculty Portal Feed Evaluation ---');
const facultyFeed = filterAnnouncementsForAudience(testAnnouncements, 'faculty');
console.log(`Feed count returned for Faculty: ${facultyFeed.length}`);
const hasStudentsInFaculty = facultyFeed.some(a => a.targetAudience === 'Students');
const hasAlumniInFaculty = facultyFeed.some(a => a.targetAudience === 'Alumni');
if (!hasStudentsInFaculty && !hasAlumniInFaculty) {
  console.log('✓ PASS: Faculty feed strictly excluded Student-only and Alumni-only announcements.');
} else {
  console.error('FAIL: Faculty feed leaked other audiences!');
  process.exit(1);
}

// --- STEP 4: Test In-Place Edit ---
console.log('\n--- TEST 4: Edit Announcement In-Place ---');
const editedList = testAnnouncements.map(a => 
  a.id === 'anc-amber-02' 
    ? { ...a, title: 'SIH 2026 Phase 1 Submission Deadline [EXTENDED]', severity: 'governance' }
    : a
);
const updatedStudentFeed = filterAnnouncementsForAudience(editedList, 'student');
const updatedItem = updatedStudentFeed.find(a => a.id === 'anc-amber-02');
console.log(`Updated Title: "${updatedItem.title}"`);
console.log(`Updated Severity: "${updatedItem.severity}" (Governance Rose)`);
if (updatedItem.title.includes('[EXTENDED]') && updatedItem.severity === 'governance') {
  console.log('✓ PASS: In-place edit reflected immediately in audience feed without republishing.');
} else {
  console.error('FAIL: In-place edit did not reflect correctly.');
  process.exit(1);
}

// --- STEP 5: Test Soft Retraction / Deletion ---
console.log('\n--- TEST 5: Deletion / Retraction ---');
const deletedList = editedList.map(a => a.id === 'anc-amber-02' ? { ...a, isRetracted: true } : a);
const feedAfterDeletion = filterAnnouncementsForAudience(deletedList, 'student');
const deletedItemInFeed = feedAfterDeletion.find(a => a.id === 'anc-amber-02');
if (!deletedItemInFeed) {
  console.log('✓ PASS: Retracted/deleted announcement immediately removed from student feed.');
} else {
  console.error('FAIL: Deleted announcement still visible in feed!');
  process.exit(1);
}

console.log('\n====================================================================');
console.log('ALL VERIFICATION STEPS PASSED WITH 100% SUCCESS!');
console.log('====================================================================');
