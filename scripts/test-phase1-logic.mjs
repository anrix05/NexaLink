import assert from 'node:assert';

// 1. Test Sentence Case Date Formatter
const testDate = new Date('2026-11-20T13:30:00.000Z');
const formatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  weekday: 'short'
});
const parts = formatter.formatToParts(testDate);
const monthPart = parts.find(p => p.type === 'month')?.value;
console.log('Testing Date Formatting: month part =', monthPart);
assert.strictEqual(monthPart, 'Nov', 'Month must be sentence case Nov, not uppercase NOV');

// 2. Test Single Time Formatting
const timeFormatted = testDate.toLocaleTimeString('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
}).toLowerCase();
console.log('Testing Time Formatting in IST:', timeFormatted);
assert.ok(timeFormatted.includes('7:00 pm'), '7:00 pm IST expected');

// 3. Test Venue Conflict Logic
const eventA = {
  id: 'evt-1',
  venueId: 'venue-sh3',
  startsAt: '2026-11-28T05:30:00.000Z', // 11:00 am IST
  endsAt: '2026-11-28T07:00:00.000Z',   // 12:30 pm IST
  lifecycleStatus: 'published',
  title: 'Next-Gen Cloud'
};

const checkConflict = (venueId, startsAt, endsAt, currentId, events) => {
  const sNew = new Date(startsAt).getTime();
  const eNew = new Date(endsAt).getTime();
  for (const e of events) {
    if (e.id === currentId) continue;
    if (e.venueId !== venueId) continue;
    if (e.lifecycleStatus === 'cancelled' || e.lifecycleStatus === 'rejected') continue;
    const sEvt = new Date(e.startsAt).getTime();
    const eEvt = new Date(e.endsAt).getTime();
    if (sNew < eEvt && eNew > sEvt) {
      return { hasConflict: true, conflictingTitle: e.title };
    }
  }
  return { hasConflict: false };
};

// Overlapping test: 11:30 am to 1:00 pm IST at venue-sh3
const clashResult = checkConflict('venue-sh3', '2026-11-28T06:00:00.000Z', '2026-11-28T07:30:00.000Z', 'evt-2', [eventA]);
console.log('Testing Venue Conflict Detection:', clashResult);
assert.strictEqual(clashResult.hasConflict, true, 'Overlapping venue booking must be flagged');

// Non-overlapping test: 2:00 pm to 4:00 pm IST at venue-sh3
const nonClashResult = checkConflict('venue-sh3', '2026-11-28T08:30:00.000Z', '2026-11-28T10:30:00.000Z', 'evt-3', [eventA]);
assert.strictEqual(nonClashResult.hasConflict, false, 'Non-overlapping venue booking must pass');

// 4. Test Structured Compensation
const formatCompensation = (job) => {
  if (job.compensationDisclosed === false) return 'Competitive / Not disclosed';
  if (job.compensationMin === 0 && (!job.compensationMax || job.compensationMax === 0)) return 'Unpaid';
  if (job.compensationMin !== undefined) {
    const period = job.compensationPeriod || 'per_year';
    if (period === 'per_year') {
      const minLpa = (job.compensationMin / 100000).toFixed(1);
      const maxLpa = job.compensationMax ? (job.compensationMax / 100000).toFixed(1) : undefined;
      return maxLpa ? `₹${minLpa} – ${maxLpa} LPA` : `₹${minLpa} LPA`;
    } else {
      return `₹${job.compensationMin.toLocaleString('en-IN')} / month`;
    }
  }
  return job.stipendOrSalary || 'Competitive';
};

const lpaComp = formatCompensation({ compensationDisclosed: true, compensationMin: 1800000, compensationMax: 2400000, compensationPeriod: 'per_year' });
console.log('Testing LPA format:', lpaComp);
assert.strictEqual(lpaComp, '₹18.0 – 24.0 LPA');

const monthlyComp = formatCompensation({ compensationDisclosed: true, compensationMin: 50000, compensationPeriod: 'per_month' });
console.log('Testing Monthly format:', monthlyComp);
assert.strictEqual(monthlyComp, '₹50,000 / month');

// 5. Test Waitlist Promotion Logic
const initialRegistered = ['u-1', 'u-2'];
const initialWaitlist = ['u-3', 'u-4'];
const cancelUserId = 'u-1';

const hasWaitlist = initialWaitlist.length > 0;
const promotedUserId = hasWaitlist ? initialWaitlist[0] : undefined;
const remainingWaitlist = hasWaitlist ? initialWaitlist.slice(1) : initialWaitlist;
const updatedRegistered = initialRegistered.filter(id => id !== cancelUserId);
if (promotedUserId) {
  updatedRegistered.push(promotedUserId);
}

console.log('Testing Waitlist Promotion:', { updatedRegistered, remainingWaitlist, promotedUserId });
assert.deepStrictEqual(updatedRegistered, ['u-2', 'u-3'], 'Waitlist user u-3 must be promoted into registered');
assert.deepStrictEqual(remainingWaitlist, ['u-4'], 'Remaining waitlist must only contain u-4');

console.log('All Phase 1 logic assertions passed successfully!');
