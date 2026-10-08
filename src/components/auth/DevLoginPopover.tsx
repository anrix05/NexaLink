import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, Sparkles, RotateCcw, Check } from 'lucide-react';
import type { UserRole } from '../../types';

export const DevLoginPopover: React.FC = () => {
  const { switchRole, login, currentRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [personasData, setPersonasData] = useState<{ main: any[]; extra: any[] } | null>(null);
  const [seedStatus, setSeedStatus] = useState<string>('Seed OK');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      import('../../dev/mock')
        .then((mod) => {
          setPersonasData(mod.getDevPersonas());
          const res = mod.getLastSelfCheckResult ? mod.getLastSelfCheckResult() : { ok: true, problemCount: 0 };
          setSeedStatus(res.ok ? 'Seed OK' : `Seed: ${res.problemCount} problems (see console)`);
        })
        .catch((err) => {
          console.error('[DevLoginPopover] Failed to load mock personas:', err);
        });
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleSelectMain = (role: UserRole) => {
    switchRole(role);
    setIsOpen(false);
  };

  const handleSelectExtra = async (extraId: string) => {
    try {
      const matched = personasData?.extra.find((item: any) => item.id === extraId);
      if (matched && matched.targetUser) {
        await login(matched.email, matched.role, undefined, matched.targetUser);
      }
    } catch (err) {
      console.error('[DevLoginPopover] Failed to login as extra persona:', err);
    } finally {
      setIsOpen(false);
    }
  };

  const handleResetDemoData = async () => {
    setIsResetting(true);
    try {
      const { resetSeed, clearMockStorage, getDevPersonas } = await import('../../dev/mock');
      resetSeed();
      clearMockStorage();
      setPersonasData(getDevPersonas());

      // Return current mock session to dashboard by refreshing role
      if (currentRole) {
        await switchRole(currentRole);
      } else {
        await switchRole('student');
      }

      // Signal in-memory stores and contexts to synchronize
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('storage'));

      setResetDone(true);
      setTimeout(() => {
        setResetDone(false);
        setIsOpen(false);
      }, 700);
    } catch (err) {
      console.error('[DevLoginPopover] Failed to reset demo data:', err);
    } finally {
      setIsResetting(false);
    }
  };

  if (!import.meta.env.DEV) return null;

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-50 select-none">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm text-xs font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
        <span>Dev login</span>
        <ChevronDown className={`w-3 h-3 text-[#6B7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-80 max-h-[85vh] overflow-y-auto rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] shadow-md p-2 flex flex-col gap-1.5">
          <div className="px-2 py-1 border-b border-[#E5E7EB] flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#6B7280]">
              Fast Dev Personas (DEV only)
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded font-mono ${
                seedStatus === 'Seed OK' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-800 bg-amber-50'
              }`}>
                {seedStatus}
              </span>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">
                LOCAL
              </span>
            </div>
          </div>

          {/* Main 4 Personas */}
          <div className="flex flex-col gap-0.5">
            {(personasData?.main || []).map((p: any) => (
              <button
                key={p.role}
                type="button"
                onClick={() => handleSelectMain(p.role)}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#FAFAFA] transition-colors flex flex-col focus:outline-none focus:bg-[#FAFAFA]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#0A0A0A]">{p.name}</span>
                  <span className="text-[10px] text-[#6B7280] capitalize border border-[#E5E7EB] px-1.5 py-0.2 rounded bg-[#FFFFFF]">
                    {p.role}
                  </span>
                </div>
                <span className="text-[11px] text-[#6B7280] truncate">{p.email}</span>
              </button>
            ))}
          </div>

          {/* Extra Personas: Dev logins (local only) */}
          <div className="pt-1.5 border-t border-[#E5E7EB]">
            <div className="px-2 pb-1">
              <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                Dev logins (local only)
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {(personasData?.extra || []).map((ep: any) => (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => handleSelectExtra(ep.id)}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#FAFAFA] transition-colors flex flex-col focus:outline-none focus:bg-[#FAFAFA]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#0A0A0A]">{ep.name}</span>
                    <span className="text-[9px] text-[#4B5563] border border-[#E5E7EB] px-1 py-0.2 rounded bg-[#F9FAFB]">
                      {ep.description.split('(')[0].trim()}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6B7280] truncate">{ep.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reset Demo Data Action (Section 4.3) */}
          <div className="pt-1.5 border-t border-[#E5E7EB]">
            <button
              type="button"
              disabled={isResetting}
              onClick={handleResetDemoData}
              className="w-full py-2 px-3 rounded-md bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] text-xs font-medium transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
            >
              {resetDone ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Demo data reset!</span>
                </>
              ) : (
                <>
                  <RotateCcw className={`w-3.5 h-3.5 text-[#4B5563] ${isResetting ? 'animate-spin' : ''}`} />
                  <span>{isResetting ? 'Resetting...' : 'Reset demo data'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
