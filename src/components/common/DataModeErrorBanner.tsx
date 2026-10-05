import React from 'react';
import { AlertTriangle, ServerOff, Terminal } from 'lucide-react';

interface DataModeErrorBannerProps {
  reason: string;
}

export const DataModeErrorBanner: React.FC<DataModeErrorBannerProps> = ({ reason }) => {
  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-950/95 p-6 text-slate-100 backdrop-blur-md">
      <div className="max-w-xl w-full rounded-2xl border border-red-500/30 bg-slate-900/90 p-8 shadow-2xl shadow-red-950/50">
        <div className="flex items-center gap-4 text-red-400 mb-6">
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
            <ServerOff className="w-8 h-8 text-red-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Configuration Error <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">F1 Gate</span>
            </h1>
            <p className="text-sm text-slate-400">Database connection requirements not satisfied</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-sm mb-6 leading-relaxed flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{reason}</span>
        </div>

        <div className="space-y-4 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300">
          <div className="flex items-center gap-2 text-slate-400 border-b border-slate-800 pb-2 font-sans font-semibold text-xs">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Resolution Steps:</span>
          </div>
          <p className="text-slate-400 font-sans">
            Add or update the following configuration in your local <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">.env</code> file:
          </p>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-indigo-300 select-all space-y-1">
            <div>VITE_DATA_MODE=live</div>
            <div>VITE_SUPABASE_URL=https://wyjfmtksmumvzqugppys.supabase.co</div>
            <div>VITE_SUPABASE_ANON_KEY=&lt;your-anon-key&gt;</div>
          </div>
          <p className="text-slate-500 text-[11px] font-sans">
            Or, to run offline with synthetic mock records, set <code className="text-emerald-400 font-mono">VITE_DATA_MODE=mock</code>.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors border border-slate-700 shadow-sm"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};
