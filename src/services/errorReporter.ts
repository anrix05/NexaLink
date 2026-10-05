export interface AppErrorEvent {
  id: string;
  name: string;
  message: string;
  operation: string;
  target: string;
  timestamp: string;
  code?: string;
  details?: any;
  payload?: any;
}

type ErrorListener = (errors: AppErrorEvent[]) => void;

class ErrorReporter {
  private activeErrors: AppErrorEvent[] = [];
  private listeners: Set<ErrorListener> = new Set();

  public subscribe(listener: ErrorListener): () => void {
    this.listeners.add(listener);
    listener([...this.activeErrors]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public reportError(error: any, context?: { operation: string; target: string; payload?: any }): void {
    const errorEvent: AppErrorEvent = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `err-${Date.now()}-${Math.random()}`,
      name: error?.name || 'SupabaseOperationError',
      message: error?.message || 'An unexpected database operation error occurred.',
      operation: context?.operation || error?.operation || 'UNKNOWN_OPERATION',
      target: context?.target || error?.target || 'UNKNOWN_TARGET',
      timestamp: new Date().toISOString(),
      code: error?.code || error?.rawError?.code,
      details: error?.rawError || error?.details,
      payload: context?.payload || error?.payload
    };

    console.error(`[ErrorReporter] [${errorEvent.name}] ${errorEvent.operation} on ${errorEvent.target}:`, error);

    this.activeErrors = [errorEvent, ...this.activeErrors.slice(0, 4)];
    this.notify();

    // Auto-dismiss standard non-critical toasts after 8 seconds
    setTimeout(() => {
      this.dismiss(errorEvent.id);
    }, 8000);
  }

  public dismiss(id: string): void {
    const next = this.activeErrors.filter(e => e.id !== id);
    if (next.length !== this.activeErrors.length) {
      this.activeErrors = next;
      this.notify();
    }
  }

  public clearAll(): void {
    this.activeErrors = [];
    this.notify();
  }

  private notify(): void {
    const snapshot = [...this.activeErrors];
    this.listeners.forEach(fn => fn(snapshot));
  }
}

export const errorReporter = new ErrorReporter();
