import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Copy, Check, X, ShieldAlert, Database, FileWarning } from 'lucide-react';
import { errorReporter, type AppErrorEvent } from '../../services/errorReporter';


export const GlobalErrorToaster: React.FC = () => {
  const [errors, setErrors] = useState<AppErrorEvent[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = errorReporter.subscribe(errs => {
      setErrors(errs);
    });
    return unsubscribe;
  }, []);

  const handleCopy = (error: AppErrorEvent) => {
    const payload = JSON.stringify(
      {
        error: error.name,
        code: error.code,
        operation: error.operation,
        target: error.target,
        message: error.message,
        timestamp: error.timestamp,
        details: error.details,
        payload: error.payload
      },
      null,
      2
    );

    if (navigator.clipboard) {
      navigator.clipboard.writeText(payload);
      setCopiedId(error.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const getErrorIcon = (name: string) => {
    if (name.includes('Rls')) return <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />;
    if (name.includes('Table') || name.includes('Rpc')) return <Database className="w-5 h-5 text-rose-400 shrink-0" />;
    if (name.includes('Persist')) return <FileWarning className="w-5 h-5 text-orange-400 shrink-0" />;
    return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
  };

  return (
    <aside
      aria-label="Database and System Error Alerts"
      className="fixed bottom-6 right-6 z-99999 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence>
        {errors.map(err => (
          <motion.div
            key={err.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto rounded-xl border border-red-500/30 bg-slate-950/95 p-4 text-slate-100 shadow-2xl shadow-red-950/40 backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {getErrorIcon(err.name)}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-red-200">{err.name}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {err.operation} → {err.target}
                    </span>
                    {err.code && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40">
                        {err.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-snug break-words">
                    {err.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => errorReporter.dismiss(err.id)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 shrink-0"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 font-mono">
                {new Date(err.timestamp).toLocaleTimeString()}
              </span>
              <button
                onClick={() => handleCopy(err)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800 font-mono text-[11px]"
              >
                {copiedId === err.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied Payload</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Debug Payload</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </aside>
  );
};
