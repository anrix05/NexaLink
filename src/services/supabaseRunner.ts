import { errorReporter } from './errorReporter.ts';

export class BaseSupabaseError extends Error {
  public readonly operation: string;
  public readonly target: string;
  public readonly code?: string;
  public readonly rawError?: any;
  public readonly timestamp: string;

  constructor(name: string, message: string, operation: string, target: string, code?: string, rawError?: any) {
    super(message);
    this.name = name;
    this.operation = operation;
    this.target = target;
    this.code = code;
    this.rawError = rawError;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RlsForbiddenError extends BaseSupabaseError {
  constructor(operation: string, target: string, rawError?: any) {
    super(
      'RlsForbiddenError',
      `Permission denied by Row Level Security (RLS) for ${operation} on "${target}".`,
      operation,
      target,
      '42501',
      rawError
    );
  }
}

export class RpcNotFoundError extends BaseSupabaseError {
  constructor(operation: string, target: string, rawError?: any) {
    super(
      'RpcNotFoundError',
      `Database function / RPC "${target}" was not found or is uncallable.`,
      operation,
      target,
      'PGRST202',
      rawError
    );
  }
}

export class TableNotFoundError extends BaseSupabaseError {
  constructor(operation: string, target: string, rawError?: any) {
    super(
      'TableNotFoundError',
      `Relation / table "${target}" does not exist in the public schema.`,
      operation,
      target,
      'PGRST205',
      rawError
    );
  }
}

export class UniqueViolationError extends BaseSupabaseError {
  constructor(operation: string, target: string, rawError?: any) {
    super(
      'UniqueViolationError',
      `Unique constraint violation during ${operation} on "${target}".`,
      operation,
      target,
      '23505',
      rawError
    );
  }
}

export class MutationDidNotPersistError extends BaseSupabaseError {
  constructor(operation: string, target: string, rawError?: any) {
    super(
      'MutationDidNotPersistError',
      `Database mutation (${operation} on "${target}") succeeded without error but returned 0 rows. Changes did not persist.`,
      operation,
      target,
      'MUTATION_NO_ROWS',
      rawError
    );
  }
}

export class SupabaseOperationError extends BaseSupabaseError {
  constructor(operation: string, target: string, code?: string, message?: string, rawError?: any) {
    super(
      'SupabaseOperationError',
      message || `Supabase operation ${operation} failed on "${target}".`,
      operation,
      target,
      code,
      rawError
    );
  }
}

function mapSupabaseError(error: any, operation: string, target: string): BaseSupabaseError {
  const code = error?.code || error?.status?.toString();
  const message = error?.message || error?.details || 'Database error occurred';

  if (code === '42501') {
    return new RlsForbiddenError(operation, target, error);
  }
  if (code === 'PGRST202') {
    return new RpcNotFoundError(operation, target, error);
  }
  if (code === 'PGRST205' || code === '42P01') {
    return new TableNotFoundError(operation, target, error);
  }
  if (code === '23505') {
    return new UniqueViolationError(operation, target, error);
  }

  return new SupabaseOperationError(operation, target, code, message, error);
}

export interface RequestMetricEntry {
  op: string;
  target: string;
  durationMs: number;
  rowCount: number;
  payloadBytes: number;
  timestamp: string;
}

export interface RequestCounterMetrics {
  totalRequests: number;
  totalDurationMs: number;
  operations: Record<string, number>;
  targets: Record<string, number>;
  entries: RequestMetricEntry[];
}

let devRequestMetrics: RequestCounterMetrics = {
  totalRequests: 0,
  totalDurationMs: 0,
  operations: {},
  targets: {},
  entries: []
};

function recordDevMetric(op: string, target: string, durationMs: number, data: any): void {
  const isDevOrTest = Boolean(
    (typeof import.meta !== 'undefined' && import.meta?.env?.DEV) ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production')
  );
  if (!isDevOrTest) return;

  const rowCount = Array.isArray(data) ? data.length : data ? 1 : 0;
  let payloadBytes = 0;
  try {
    payloadBytes = data ? JSON.stringify(data).length : 0;
  } catch {}

  devRequestMetrics.totalRequests++;
  devRequestMetrics.totalDurationMs += durationMs;
  devRequestMetrics.operations[op] = (devRequestMetrics.operations[op] || 0) + 1;
  devRequestMetrics.targets[target] = (devRequestMetrics.targets[target] || 0) + 1;
  devRequestMetrics.entries.push({
    op,
    target,
    durationMs,
    rowCount,
    payloadBytes,
    timestamp: new Date().toISOString()
  });
}

export function getDevRequestMetrics(): RequestCounterMetrics {
  return {
    ...devRequestMetrics,
    operations: { ...devRequestMetrics.operations },
    targets: { ...devRequestMetrics.targets },
    entries: [...devRequestMetrics.entries]
  };
}

export function resetDevRequestMetrics(): void {
  devRequestMetrics = {
    totalRequests: 0,
    totalDurationMs: 0,
    operations: {},
    targets: {},
    entries: []
  };
}

/**
 * Execute a read query with logging and error mapping
 */
export async function runQuery<T>(
  target: string,
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const start = performance.now();
  const op = 'SELECT';

  try {
    const { data, error } = await queryFn();
    const duration = Math.round(performance.now() - start);

    if (error) {
      const mapped = mapSupabaseError(error, op, target);
      console.warn(`[SupabaseRunner] ${op} ${target} failed after ${duration}ms:`, mapped);
      errorReporter.reportError(mapped, { operation: op, target });
      throw mapped;
    }

    recordDevMetric(op, target, duration, data);

    if (import.meta?.env?.DEV) {
      console.debug(`[SupabaseRunner] ${op} ${target} completed in ${duration}ms`);
    }

    return (data ?? ([] as any)) as T;
  } catch (err: any) {
    if (err instanceof BaseSupabaseError) throw err;
    const duration = Math.round(performance.now() - start);
    const mapped = new SupabaseOperationError(op, target, 'UNKNOWN', err?.message || String(err), err);
    console.error(`[SupabaseRunner] ${op} ${target} threw after ${duration}ms:`, mapped);
    errorReporter.reportError(mapped, { operation: op, target });
    throw mapped;
  }
}

/**
 * Execute an insert/update/upsert/delete mutation with server-row verification and error reporting
 */
export async function runMutation<T>(
  operation: 'INSERT' | 'UPDATE' | 'UPSERT' | 'DELETE',
  target: string,
  mutationFn: () => Promise<{ data: T | null; error: any }>,
  options?: { payload?: any; allowEmptyResult?: boolean }
): Promise<T> {
  const start = performance.now();

  try {
    const { data, error } = await mutationFn();
    const duration = Math.round(performance.now() - start);

    if (error) {
      const mapped = mapSupabaseError(error, operation, target);
      console.error(`[SupabaseRunner] ${operation} ${target} failed after ${duration}ms:`, mapped);
      errorReporter.reportError(mapped, { operation, target, payload: options?.payload });
      throw mapped;
    }

    // Verify persistence: unless explicitly allowed (e.g. DELETE), check data returned
    if (!options?.allowEmptyResult) {
      const isEmptyArray = Array.isArray(data) && data.length === 0;
      const isNullish = data === null || data === undefined;
      if (isEmptyArray || isNullish) {
        const notPersistedError = new MutationDidNotPersistError(operation, target);
        console.error(`[SupabaseRunner] ${operation} ${target} returned 0 rows:`, notPersistedError);
        errorReporter.reportError(notPersistedError, { operation, target, payload: options?.payload });
        throw notPersistedError;
      }
    }

    recordDevMetric(operation, target, duration, data);
    console.info(`[SupabaseRunner] ${operation} ${target} successfully persisted in ${duration}ms`);
    return data as T;
  } catch (err: any) {
    if (err instanceof BaseSupabaseError) throw err;
    const duration = Math.round(performance.now() - start);
    const mapped = new SupabaseOperationError(operation, target, 'UNKNOWN', err?.message || String(err), err);
    console.error(`[SupabaseRunner] ${operation} ${target} threw after ${duration}ms:`, mapped);
    errorReporter.reportError(mapped, { operation, target, payload: options?.payload });
    throw mapped;
  }
}

/**
 * Execute a stored procedure (RPC) call with error mapping and logging
 */
export async function runRpc<T>(
  rpcName: string,
  rpcFn: () => Promise<{ data: T | null; error: any }>,
  args?: any
): Promise<T> {
  const start = performance.now();
  const op = 'RPC';

  try {
    const { data, error } = await rpcFn();
    const duration = Math.round(performance.now() - start);

    if (error) {
      const mapped = mapSupabaseError(error, op, rpcName);
      console.error(`[SupabaseRunner] ${op} ${rpcName} failed after ${duration}ms:`, mapped);
      errorReporter.reportError(mapped, { operation: op, target: rpcName, payload: args });
      throw mapped;
    }

    recordDevMetric(op, rpcName, duration, data);
    console.info(`[SupabaseRunner] ${op} ${rpcName} succeeded in ${duration}ms`);
    return data as T;
  } catch (err: any) {
    if (err instanceof BaseSupabaseError) throw err;
    const duration = Math.round(performance.now() - start);
    const mapped = new SupabaseOperationError(op, rpcName, 'UNKNOWN', err?.message || String(err), err);
    console.error(`[SupabaseRunner] ${op} ${rpcName} threw after ${duration}ms:`, mapped);
    errorReporter.reportError(mapped, { operation: op, target: rpcName, payload: args });
    throw mapped;
  }
}
