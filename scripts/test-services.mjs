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

